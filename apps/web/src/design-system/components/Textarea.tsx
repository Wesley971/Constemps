import { useId, useState } from 'react'
import type { CSSProperties, ChangeEventHandler } from 'react'

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
  style?: CSSProperties
}

export function Textarea({ label, placeholder = 'Write a short bio', hint, error, rows = 4, disabled, id, value, onChange, style }: TextareaProps) {
  const [focused, setFocused] = useState(false)
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const borderColor = error ? 'var(--danger)' : focused ? 'var(--teal-deep)' : 'var(--line)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', ...style }}>
      {label ? (
        <label htmlFor={fieldId} style={{ font: 'var(--text-label)', color: 'var(--ink)' }}>
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
        style={{
          border: `1.5px solid ${borderColor}`,
          borderRadius: 'var(--radius-input)',
          padding: '11px 14px',
          font: 'var(--text-body-md)',
          color: 'var(--ink)',
          background: disabled ? 'var(--canvas)' : 'var(--white)',
          opacity: disabled ? 0.55 : 1,
          resize: 'vertical',
          boxShadow: focused ? 'var(--focus-ring)' : 'none',
          outline: 'none',
          fontFamily: 'var(--font-body)',
          transition: 'border-color var(--duration-base) var(--ease-standard), box-shadow var(--duration-base) var(--ease-standard)',
        }}
      />
      {error ? (
        <span style={{ font: 'var(--text-caption)', color: 'var(--danger)' }}>{error}</span>
      ) : hint ? (
        <span style={{ font: 'var(--text-caption)', color: 'var(--inksoft)' }}>{hint}</span>
      ) : null}
    </div>
  )
}
