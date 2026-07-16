interface RadioOption {
  value: string
  label: string
}

interface RadioProps {
  name: string
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  inline?: boolean
}

export function Radio({ name, options, value, onChange, disabled, inline }: RadioProps) {
  return (
    <div style={{ display: 'flex', flexDirection: inline ? 'row' : 'column', gap: inline ? 20 : 10, opacity: disabled ? 0.55 : 1 }}>
      {options.map((opt) => {
        const checked = value === opt.value
        return (
          <label
            key={opt.value}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'default' : 'pointer' }}
          >
            <span style={{ position: 'relative', width: 20, height: 20, flexShrink: 0 }}>
              <input
                type="radio"
                name={name}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'inherit', margin: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: `1.5px solid ${checked ? 'var(--teal-deep)' : 'var(--line)'}`,
                  background: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {checked ? <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--teal)' }} /> : null}
              </span>
            </span>
            <span style={{ font: 'var(--text-body-md)', color: 'var(--ink)' }}>{opt.label}</span>
          </label>
        )
      })}
    </div>
  )
}
