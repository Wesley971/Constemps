import type { CSSProperties, ReactNode } from 'react'

type ChipTone = 'default' | 'on-dark' | 'on-tint' | 'glass'

interface ChipProps {
  children: ReactNode
  icon?: string
  tone?: ChipTone
  style?: CSSProperties
}

const tones: Record<ChipTone, CSSProperties> = {
  default: { background: 'var(--white)', color: 'var(--ink)', border: '1px solid var(--line)' },
  'on-dark': { background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)' },
  'on-tint': { background: 'rgba(255,255,255,0.6)', color: 'var(--teal-deep)', border: '1px solid rgba(15,157,143,0.18)' },
  glass: { background: 'rgba(255,255,255,0.7)', color: 'var(--ink)', border: '1px solid rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)' },
}

export function Chip({ children, icon, tone = 'default', style }: ChipProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        fontSize: 12.5,
        padding: '6px 13px',
        borderRadius: 'var(--radius-pill)',
        ...tones[tone],
        ...style,
      }}
    >
      {icon ? <iconify-icon icon={icon} width="13"></iconify-icon> : null}
      {children}
    </span>
  )
}
