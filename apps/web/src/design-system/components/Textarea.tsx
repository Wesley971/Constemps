import { useId } from 'react'
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
}

// Même champ au pinceau qu'Input (CON-57), sur plusieurs lignes.
export function Textarea({ label, placeholder = '', hint, error, rows = 4, disabled, id, value, onChange, className }: TextareaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const messageId = `${fieldId}-message`

  return (
    <div className={`group flex flex-col gap-2 w-full ${disabled ? 'opacity-60' : ''} ${className ?? ''}`}>
      {label ? <Label htmlFor={fieldId}>{label}</Label> : null}
      <div>
        <textarea
          id={fieldId}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className="block w-full p-0 border-none bg-transparent font-body text-body-lg text-ink resize-y placeholder:text-inksoft"
        />
        <BrushLine error={Boolean(error)} />
      </div>
      <span id={messageId} className={`font-body text-caption min-h-4 ${error ? 'text-danger' : 'text-inksoft'}`}>
        {error ?? hint ?? ''}
      </span>
    </div>
  )
}
