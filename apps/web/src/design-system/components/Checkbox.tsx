import type { ReactNode } from 'react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  disabled?: boolean
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label className={`inline-flex items-center gap-2.5 ${disabled ? 'cursor-default opacity-55' : 'cursor-pointer'}`}>
      <span className="relative w-5 h-5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 opacity-0 cursor-inherit m-0"
        />
        <span
          className={`absolute inset-0 rounded-xs border-[1.5px] flex items-center justify-center ${
            checked ? 'border-indigo-deep bg-indigo text-paper' : 'border-line bg-paper'
          }`}
        >
          {checked ? <iconify-icon icon="ph:check-bold" width="13"></iconify-icon> : null}
        </span>
      </span>
      {label ? <span className="font-body text-body-md text-ink">{label}</span> : null}
    </label>
  )
}
