import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-paper-sunken text-inksoft',
  accent: 'bg-indigo-tint text-indigo-deep',
  success: 'bg-success-tint text-success-deep',
  warning: 'bg-warning-tint text-warning-deep',
  danger: 'bg-danger-tint text-danger-deep',
  info: 'bg-info-tint text-info-deep',
}

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  icon?: string
}

export function Badge({ children, tone = 'neutral', icon }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.25 font-body text-micro uppercase tracking-micro px-2.75 py-1.25 rounded-pill ${tones[tone]}`}
    >
      {icon ? <iconify-icon icon={icon} width="11"></iconify-icon> : null}
      {children}
    </span>
  )
}
