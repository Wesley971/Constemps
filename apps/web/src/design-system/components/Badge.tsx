import type { CSSProperties, ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'teal' | 'success' | 'warning' | 'danger' | 'info'

const tones: Record<BadgeTone, CSSProperties> = {
  neutral: { background: 'var(--canvas)', color: 'var(--inksoft)', border: '1px solid var(--line)' },
  teal: { background: 'var(--teal-tint)', color: 'var(--teal-deep)' },
  success: { background: 'var(--success-tint)', color: 'var(--success-deep)' },
  warning: { background: 'var(--warning-tint)', color: 'var(--warning-deep)' },
  danger: { background: 'var(--danger-tint)', color: 'var(--danger-deep)' },
  info: { background: 'var(--info-tint)', color: 'var(--info-deep)' },
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        font: 'var(--text-micro)',
        letterSpacing: 'var(--tracking-micro)',
        textTransform: 'uppercase',
        padding: '5px 10px',
        borderRadius: 'var(--radius-pill)',
        ...tones[tone],
      }}
    >
      {children}
    </span>
  )
}
