import type { CSSProperties } from 'react'

type ProgressBarTone = 'teal' | 'success' | 'warning' | 'danger'

const colors: Record<ProgressBarTone, string> = {
  teal: 'var(--teal)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
}

interface ProgressBarProps {
  value: number
  label?: string
  tone?: ProgressBarTone
  style?: CSSProperties
}

export function ProgressBar({ value, label, tone = 'teal', style }: ProgressBarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', ...style }}>
      {label ? (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ font: 'var(--text-label)', color: 'var(--ink)' }}>{label}</span>
          <span style={{ font: 'var(--text-body-sm)', color: 'var(--inksoft)' }}>{value}%</span>
        </div>
      ) : null}
      <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--line)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            borderRadius: 'var(--radius-pill)',
            background: colors[tone],
            transition: 'width var(--duration-slow) var(--ease-standard)',
          }}
        />
      </div>
    </div>
  )
}
