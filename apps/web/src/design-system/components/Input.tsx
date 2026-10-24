import { useId, useState } from 'react'
import type { ChangeEventHandler } from 'react'
import { Label } from './Label'
import { BrushLine } from './BrushLine'
import { FieldMessage } from './FieldMessage'

interface InputProps {
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  icon?: string
  disabled?: boolean
  type?: string
  id?: string
  value?: string
  defaultValue?: string
  onChange?: ChangeEventHandler<HTMLInputElement>
  required?: boolean
  minLength?: number
  className?: string
}

// Champ au pinceau (CON-57) : sans cadre, étiquette vermillon au-dessus, trait
// au pinceau dessous. La ligne de message (aide ou erreur) est toujours réservée,
// pour qu'une erreur qui apparaît ne décale pas le reste du formulaire.
export function Input({
  label,
  placeholder = '',
  hint,
  error,
  icon,
  disabled,
  type = 'text',
  id,
  value,
  defaultValue,
  onChange,
  required,
  minLength,
  className,
}: InputProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const messageId = `${fieldId}-message`

  const isPassword = type === 'password'
  const [passwordVisible, setPasswordVisible] = useState(false)
  const effectiveType = isPassword && passwordVisible ? 'text' : type

  return (
    <div className={`group flex flex-col gap-2 w-full ${disabled ? 'opacity-60' : ''} ${className ?? ''}`}>
      {label ? <Label htmlFor={fieldId}>{label}</Label> : null}
      <div>
        <div className="flex items-end gap-2 min-h-field">
          {icon ? (
            <span className="text-inksoft flex items-center h-field" aria-hidden="true">
              <iconify-icon icon={icon} width="16"></iconify-icon>
            </span>
          ) : null}
          <input
            id={fieldId}
            type={effectiveType}
            placeholder={placeholder}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            required={required}
            minLength={minLength}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? messageId : undefined}
            className="flex-1 w-full h-field p-0 border-none bg-transparent font-body text-body-lg text-ink placeholder:text-inksoft"
          />
          {isPassword ? (
            // Cible tactile de 44px, ramenée à la hauteur du champ par des marges négatives.
            <button
              type="button"
              onClick={() => setPasswordVisible((prev) => !prev)}
              disabled={disabled}
              aria-label={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="shrink-0 -my-2 -mr-3 flex items-center justify-center w-hit h-hit text-inksoft hover:text-ink transition-colors duration-base ease-standard bg-transparent border-none p-0 cursor-pointer disabled:cursor-default"
            >
              <iconify-icon icon={passwordVisible ? 'ph:eye-slash-bold' : 'ph:eye-bold'} width="16"></iconify-icon>
            </button>
          ) : null}
        </div>
        <BrushLine error={Boolean(error)} />
      </div>
      <FieldMessage id={messageId} hint={hint} error={error} />
    </div>
  )
}
