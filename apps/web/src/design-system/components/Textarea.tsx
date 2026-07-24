import { useId, useState } from 'react'
import type { ChangeEventHandler } from 'react'

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

export function Textarea({ label, placeholder = 'Write a short bio', hint, error, rows = 4, disabled, id, value, onChange, className }: TextareaProps) {
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
      <textarea
        id={fieldId}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`border-[1.5px] rounded-input px-3.5 py-[11px] font-body text-body-md text-ink resize-y outline-none transition-[border-color,box-shadow] duration-base ease-standard ${borderColor} ${
          disabled ? 'bg-canvas opacity-55' : 'bg-white'
        } ${focused ? 'shadow-focus' : ''}`}
      />
      {error ? (
        <span className="font-body text-caption text-danger">{error}</span>
      ) : hint ? (
        <span className="font-body text-caption text-inksoft">{hint}</span>
      ) : null}
    </div>
  )
}
