import { useId } from 'react'
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

export function Textarea({ label, placeholder = '', hint, error, rows = 4, disabled, id, value, onChange, className }: TextareaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const borderColor = error ? 'border-danger' : 'border-line focus:border-indigo-deep'

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
        className={`border-[1.5px] rounded-sm px-3.5 py-2.75 font-body text-body-md text-ink resize-y outline-none transition-[border-color,box-shadow] duration-base ease-standard focus-visible:shadow-focus-ring ${borderColor} ${
          disabled ? 'bg-paper-sunken opacity-60' : 'bg-paper'
        }`}
      />
      {error ? (
        <span className="font-body text-caption text-danger">{error}</span>
      ) : hint ? (
        <span className="font-body text-caption text-inkfaint">{hint}</span>
      ) : null}
    </div>
  )
}
