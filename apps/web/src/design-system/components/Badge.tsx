import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'teal' | 'success' | 'warning' | 'danger' | 'info'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-canvas text-inksoft border border-line',
  teal: 'bg-teal-tint text-teal-deep',
  success: 'bg-success-tint text-success-deep',
  warning: 'bg-warning-tint text-warning-deep',
  danger: 'bg-danger-tint text-danger-deep',
  info: 'bg-info-tint text-info-deep',
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center gap-[5px] font-body text-micro uppercase px-2.5 py-[5px] rounded-pill ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
