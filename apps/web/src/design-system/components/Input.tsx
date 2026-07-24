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
  placeholder = 'Type here',
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
  const [focused, setFocused] = useState(false)
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const borderColor = error ? 'border-danger' : focused ? 'border-teal-deep' : 'border-line'

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className ?? ''}`}>
      {label ? (
        <label htmlFor={fieldId} className="font-body text-label text-ink">
          {label}
        </label>
      ) : null}
      <div
        className={`flex items-center gap-2 rounded-input px-3.5 py-2.75 border-[1.5px] transition-[border-color,box-shadow] duration-base ease-standard ${borderColor} ${
          disabled ? 'bg-canvas opacity-55' : 'bg-white'
        } ${focused ? 'shadow-focus' : ''}`}
      >
        {icon ? (
          <span className="text-inksoft flex items-center">
            <iconify-icon icon={icon} width="16"></iconify-icon>
          </span>
        ) : null}
        <input
          id={fieldId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          required={required}
          minLength={minLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="border-none outline-none flex-1 bg-transparent font-body text-body-md text-ink w-full"
        />
      </div>
      {error ? (
        <span className="font-body text-caption text-danger">{error}</span>
      ) : hint ? (
        <span className="font-body text-caption text-inksoft">{hint}</span>
      ) : null}
    </div>
  )
}
