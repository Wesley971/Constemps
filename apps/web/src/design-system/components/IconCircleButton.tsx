import type { CSSProperties, MouseEventHandler } from 'react'

type IconCircleTone = 'ink' | 'ghost' | 'teal'

interface IconCircleButtonProps {
  icon: string
  tone?: IconCircleTone
  size?: number
  onClick?: MouseEventHandler<HTMLButtonElement>
  style?: CSSProperties
  title?: string
}

const tones: Record<IconCircleTone, CSSProperties> = {
  ink: { background: 'var(--ink)', color: '#fff' },
  ghost: { background: 'var(--white)', color: 'var(--ink)', border: '1px solid var(--line)' },
  teal: { background: 'var(--teal)', color: '#fff' },
}

export function IconCircleButton({ icon, tone = 'ink', size = 40, onClick, style, title }: IconCircleButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        cursor: 'pointer',
        transition: 'transform .2s var(--ease-bounce), background .2s ease',
        ...tones[tone],
        ...style,
      }}
    >
      <iconify-icon icon={icon} width={Math.round(size * 0.42)}></iconify-icon>
    </button>
  )
}
