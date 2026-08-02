type ProgressBarTone = 'accent' | 'success' | 'warning' | 'positive'

const trackColors: Record<ProgressBarTone, string> = {
  accent: 'bg-indigo',
  success: 'bg-success',
  warning: 'bg-warning',
  positive: 'bg-clay',
}

interface ProgressBarProps {
  value: number
  label?: string
  tone?: ProgressBarTone
  ticks?: number
  className?: string
}

// Repères discrets tous les 1/10e plutôt qu'une barre pleine : un clin d'oeil
// aux jours qui s'égrènent, jamais un remplissage lisse et brillant.
export function ProgressBar({ value, label, tone = 'accent', ticks = 10, className }: ProgressBarProps) {
  const marks = Array.from({ length: ticks - 1 }, (_, i) => ((i + 1) / ticks) * 100)
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className ?? ''}`}>
      {label ? (
        <div className="flex justify-between">
          <span className="font-body text-label text-ink">{label}</span>
          <span className="font-body text-body-sm text-inkfaint">{value}%</span>
        </div>
      ) : null}
      <div className="relative h-2 rounded-pill bg-paper-sunken overflow-hidden">
        <div
          style={{ width: `${value}%` }}
          className={`h-full rounded-pill transition-[width] duration-slow ease-standard ${trackColors[tone]}`}
        />
        {marks.map((m) => (
          <div key={m} style={{ left: `${m}%` }} className="absolute top-0 bottom-0 w-px bg-paper/50" />
        ))}
      </div>
    </div>
  )
}
