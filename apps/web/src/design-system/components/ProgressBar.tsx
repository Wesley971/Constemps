type ProgressBarTone = 'teal' | 'success' | 'warning' | 'danger'

const trackColors: Record<ProgressBarTone, string> = {
  teal: 'bg-teal',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

interface ProgressBarProps {
  value: number
  label?: string
  tone?: ProgressBarTone
  className?: string
}

export function ProgressBar({ value, label, tone = 'teal', className }: ProgressBarProps) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className ?? ''}`}>
      {label ? (
        <div className="flex justify-between">
          <span className="font-body text-label text-ink">{label}</span>
          <span className="font-body text-body-sm text-inksoft">{value}%</span>
        </div>
      ) : null}
      <div className="h-2 rounded-pill bg-line overflow-hidden">
        {/* largeur pilotée par une valeur numérique en direct (0-100) : ne peut pas
            être exprimée en classe Tailwind statique, seul style inline restant de la migration */}
        <div
          style={{ width: `${value}%` }}
          className={`h-full rounded-pill transition-[width] duration-slow ease-standard ${trackColors[tone]}`}
        />
      </div>
    </div>
  )
}
