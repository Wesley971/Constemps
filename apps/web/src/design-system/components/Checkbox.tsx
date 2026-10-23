import type { ReactNode } from 'react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  disabled?: boolean
}

// Case cochée à la main (CON-70, série 18) : carré légèrement penché, vermillon une
// fois cochée. Couleurs en tokens, redéfinies sur le rideau.
export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label className={`inline-flex items-center gap-3 min-h-hit ${disabled ? 'cursor-default opacity-50' : 'cursor-pointer'}`}>
      <span className="relative size-6 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 opacity-0 cursor-inherit m-0"
        />
        <span
          aria-hidden="true"
          className={`absolute inset-0 rounded-xs flex items-center justify-center -rotate-3 peer-focus-visible:shadow-focus-ring ${
            checked ? 'bg-vermillon text-on-accent' : 'border-2 border-line'
          }`}
        >
          {checked ? (
            <svg viewBox="0 0 24 24" className="size-3">
              <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
      </span>
      {label ? <span className="font-body text-body-md text-ink">{label}</span> : null}
    </label>
  )
}
