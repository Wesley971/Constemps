import type { ReactNode } from 'react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  disabled?: boolean
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.55 : 1 }}>
      <span style={{ position: 'relative', width: 20, height: 20, flexShrink: 0 }}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'inherit', margin: 0 }}
        />
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--radius-xs)',
            border: `1.5px solid ${checked ? 'var(--teal-deep)' : 'var(--line)'}`,
            background: checked ? 'var(--teal)' : 'var(--white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {checked ? <iconify-icon icon="ph:check-bold" width="13" style={{ color: '#fff' }}></iconify-icon> : null}
        </span>
      </span>
      {label ? <span style={{ font: 'var(--text-body-md)', color: 'var(--ink)' }}>{label}</span> : null}
    </label>
  )
}
