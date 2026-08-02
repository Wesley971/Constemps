import type { ReactNode } from 'react'

type ChipTone = 'default' | 'on-dark' | 'on-tint'

interface ChipProps {
  children: ReactNode
  icon?: string
  tone?: ChipTone
  className?: string
}

const tones: Record<ChipTone, string> = {
  default: 'bg-paper text-ink border border-line',
  'on-dark': 'bg-paper/12 text-paper border border-paper/20',
  'on-tint': 'bg-white/60 text-indigo-deep border border-indigo/18',
}

export function Chip({ children, icon, tone = 'default', className }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-body font-medium text-[12.5px] px-3.25 py-1.5 rounded-pill ${tones[tone]} ${className ?? ''}`}
    >
      {icon ? <iconify-icon icon={icon} width="13"></iconify-icon> : null}
      {children}
    </span>
  )
}
