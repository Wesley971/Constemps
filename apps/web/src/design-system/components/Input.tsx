import { useId, useState } from 'react'
import type { CSSProperties, ChangeEventHandler } from 'react'

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
  style?: CSSProperties
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
  style,
}: InputProps) {
  const [focused, setFocused] = useState(false)
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const state = error ? 'error' : focused ? 'focus' : 'default'
  const borderColor = { default: 'var(--line)', focus: 'var(--teal-deep)', error: 'var(--danger)' }[state]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', ...style }}>
      {label ? (
        <label htmlFor={fieldId} style={{ font: 'var(--text-label)', color: 'var(--ink)' }}>
          {label}
        </label>
      ) : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: disabled ? 'var(--canvas)' : 'var(--white)',
          border: `1.5px solid ${borderColor}`,
          borderRadius: 'var(--radius-input)',
          padding: '11px 14px',
          boxShadow: focused ? 'var(--focus-ring)' : 'none',
          opacity: disabled ? 0.55 : 1,
          transition: 'border-color var(--duration-base) var(--ease-standard), box-shadow var(--duration-base) var(--ease-standard)',
        }}
      >
        {icon ? <iconify-icon icon={icon} width="16" style={{ color: 'var(--inksoft)' }}></iconify-icon> : null}
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
          style={{
            border: 'none',
            outline: 'none',
            flex: 1,
            background: 'transparent',
            font: 'var(--text-body-md)',
            color: 'var(--ink)',
            width: '100%',
          }}
        />
      </div>
      {error ? (
        <span style={{ font: 'var(--text-caption)', color: 'var(--danger)' }}>{error}</span>
      ) : hint ? (
        <span style={{ font: 'var(--text-caption)', color: 'var(--inksoft)' }}>{hint}</span>
      ) : null}
    </div>
  )
}
