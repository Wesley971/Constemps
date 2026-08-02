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
    <div className={`flex ${inline ? 'flex-row gap-5' : 'flex-col gap-2.5'} ${disabled ? 'opacity-55' : ''}`}>
      {options.map((opt) => {
        const checked = value === opt.value
        return (
          <label key={opt.value} className={`inline-flex items-center gap-2.5 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
            <span className="relative w-5 h-5 shrink-0">
              <input
                type="radio"
                name={name}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
                className="absolute inset-0 opacity-0 cursor-inherit m-0"
              />
              <span
                className={`absolute inset-0 rounded-full border-[1.5px] bg-paper flex items-center justify-center ${
                  checked ? 'border-indigo-deep' : 'border-line'
                }`}
              >
                {checked ? <span className="w-2.5 h-2.5 rounded-full bg-indigo" /> : null}
              </span>
            </span>
            <span className="font-body text-body-md text-ink">{opt.label}</span>
          </label>
        )
      })}
    </div>
  )
}
