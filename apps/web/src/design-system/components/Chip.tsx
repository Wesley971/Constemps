import type { ReactNode } from 'react'

type ChipTone = 'default' | 'on-dark' | 'on-tint' | 'glass'

interface ChipProps {
  children: ReactNode
  icon?: string
  tone?: ChipTone
  className?: string
}

const tones: Record<ChipTone, string> = {
  default: 'bg-white text-ink border border-line',
  'on-dark': 'bg-white/10 text-white border border-white/14',
  'on-tint': 'bg-white/60 text-teal-deep border border-teal/18',
  glass: 'bg-white/70 text-ink border border-white/50 backdrop-blur-glass',
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
