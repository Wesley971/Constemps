import { useId, useState } from 'react'
import type { ChangeEventHandler } from 'react'

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
  const borderColor = error ? 'border-danger' : 'border-line focus-within:border-indigo-deep'

  const isPassword = type === 'password'
  const [passwordVisible, setPasswordVisible] = useState(false)
  const effectiveType = isPassword && passwordVisible ? 'text' : type

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className ?? ''}`}>
      {label ? (
        <label htmlFor={fieldId} className="font-body text-label text-ink">
          {label}
        </label>
      ) : null}
      {/* Le ring de focus vit uniquement sur ce wrapper (focus-within). L'input natif
          neutralise le ring global hérité de :focus-visible (focus-visible:shadow-none,
          spécificité plus forte) pour éviter le double contour. */}
      <div
        className={`flex items-center gap-2 rounded-sm px-3.5 py-2.75 border-[1.5px] transition-[border-color,box-shadow] duration-base ease-standard focus-within:shadow-focus-ring ${borderColor} ${
          disabled ? 'bg-paper-sunken opacity-60' : 'bg-paper'
        }`}
      >
        {icon ? (
          <span className="text-inkfaint flex items-center">
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
          className="border-none outline-none focus-visible:shadow-none flex-1 bg-transparent font-body text-body-md text-ink w-full"
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setPasswordVisible((prev) => !prev)}
            disabled={disabled}
            aria-label={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="shrink-0 flex items-center text-inkfaint hover:text-ink transition-colors duration-base ease-standard bg-transparent border-none p-0 cursor-pointer disabled:cursor-default"
          >
            <iconify-icon icon={passwordVisible ? 'ph:eye-slash-bold' : 'ph:eye-bold'} width="16"></iconify-icon>
          </button>
        ) : null}
      </div>
      {error ? (
        <span className="font-body text-caption text-danger">{error}</span>
      ) : hint ? (
        <span className="font-body text-caption text-inkfaint">{hint}</span>
      ) : null}
    </div>
  )
}
