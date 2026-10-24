import { useCallback, useEffect, useId, useLayoutEffect, useRef } from 'react'
import type { ChangeEventHandler } from 'react'
import { Label } from './Label'
import { BrushLine } from './BrushLine'

interface TextareaProps {
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  rows?: number
  disabled?: boolean
  id?: string
  value?: string
  onChange?: ChangeEventHandler<HTMLTextAreaElement>
  className?: string
  // answer : champ de réponse de la révision (CON-79), en Kaisei comme le verso,
  // une ligne posée sur le trait au départ, qui grandit avec le texte.
  variant?: 'default' | 'answer'
}

const FIELD_STYLES = {
  default: 'font-body resize-y',
  answer: 'min-h-field pt-1 font-display font-medium resize-none overflow-hidden',
}

// Même champ au pinceau qu'Input (CON-57), sur plusieurs lignes.
export function Textarea({ label, placeholder = '', hint, error, rows = 4, disabled, id, value, onChange, className, variant = 'default' }: TextareaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const messageId = `${fieldId}-message`
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const autoGrow = variant === 'answer'

  // Hauteur ajustée au texte : la dernière ligne reste sur le trait. Seule la
  // largeur (fenêtre) et le chargement des polices relancent le calcul, jamais
  // la hauteur qu'il fixe lui-même.
  const fitHeight = useCallback(() => {
    const field = fieldRef.current
    if (!autoGrow || !field) return
    field.style.height = 'auto'
    field.style.height = `${field.scrollHeight}px`
  }, [autoGrow])

  useLayoutEffect(fitHeight, [fitHeight, value])

  useEffect(() => {
    if (!autoGrow) return
    window.addEventListener('resize', fitHeight)
    document.fonts?.ready.then(fitHeight).catch(() => {})
    return () => window.removeEventListener('resize', fitHeight)
  }, [autoGrow, fitHeight])

  return (
    <div className={`group flex flex-col gap-2 w-full ${disabled ? 'opacity-60' : ''} ${className ?? ''}`}>
      {label ? <Label htmlFor={fieldId}>{label}</Label> : null}
      <div>
        <textarea
          ref={fieldRef}
          id={fieldId}
          rows={autoGrow ? 1 : rows}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={`block w-full p-0 border-none bg-transparent text-body-lg text-ink placeholder:text-inksoft ${FIELD_STYLES[variant]}`}
        />
        <BrushLine error={Boolean(error)} />
      </div>
      <span id={messageId} className={`font-body text-caption min-h-4 ${error ? 'text-danger' : 'text-inksoft'}`}>
        {error ?? hint ?? ''}
      </span>
    </div>
  )
}
