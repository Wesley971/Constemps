interface RadioOption {
  value: string
  label: string
  icon?: string
  helpText?: string
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
    <div className={`flex ${inline ? 'flex-row flex-wrap gap-x-5 gap-y-2' : 'flex-col gap-2.5'} ${disabled ? 'opacity-55' : ''}`}>
      {options.map((opt) => {
        const checked = value === opt.value
        return (
          <label key={opt.value} className={`inline-flex items-start gap-2.5 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
            {/* Boîte du dot volontairement plus haute (h-6) que large (w-5) : elle épouse la
                hauteur de ligne de la 1re ligne (label) et se centre dessus via flex, que
                l'option ait ou non un helpText en-dessous (comportement identique à l'ancien
                items-center sur le label quand il n'y a qu'une seule ligne). */}
            <span className="relative w-5 h-6 shrink-0 flex items-center justify-center">
              <input
                type="radio"
                name={name}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
                className="peer absolute inset-0 opacity-0 cursor-inherit m-0"
              />
              <span
                className={`w-5 h-5 rounded-full border-[1.5px] bg-paper flex items-center justify-center peer-focus-visible:shadow-focus-ring ${
                  checked ? 'border-indigo-deep' : 'border-line'
                }`}
              >
                {checked ? <span className="w-2.5 h-2.5 rounded-full bg-indigo" /> : null}
              </span>
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1.5">
                {opt.icon ? (
                  <span className="shrink-0 flex items-center text-inkfaint">
                    <iconify-icon icon={opt.icon} width="16"></iconify-icon>
                  </span>
                ) : null}
                <span className="font-body text-body-md text-ink">{opt.label}</span>
              </span>
              {opt.helpText ? <span className="font-body text-caption text-inkfaint">{opt.helpText}</span> : null}
            </span>
          </label>
        )
      })}
    </div>
  )
}
