import type { MouseEventHandler } from 'react'

type IconCircleTone = 'ink' | 'ghost' | 'accent'
type IconCircleSize = 'sm' | 'md' | 'lg'

interface IconCircleButtonProps {
  icon: string
  tone?: IconCircleTone
  size?: IconCircleSize
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
  title?: string
}

const tones: Record<IconCircleTone, string> = {
  ink: 'bg-ink text-paper',
  ghost: 'bg-paper text-ink border border-line',
  accent: 'bg-indigo text-paper',
}

// Tailles alignées sur les 3 usages réels de l'app (28px/32px/40px), avec la
// largeur d'icône Iconify équivalente à l'ancien calcul Math.round(size*0.42).
const sizes: Record<IconCircleSize, { box: string; icon: string }> = {
  sm: { box: 'w-7 h-7', icon: '12' },
  md: { box: 'w-8 h-8', icon: '13' },
  lg: { box: 'w-10 h-10', icon: '17' },
}

export function IconCircleButton({ icon, tone = 'ink', size = 'lg', onClick, className, title }: IconCircleButtonProps) {
  const { box, icon: iconSize } = sizes[size]
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`${box} rounded-full inline-flex items-center justify-center border-none cursor-pointer transition-opacity duration-base ease-standard hover:opacity-75 ${tones[tone]} ${className ?? ''}`}
    >
      <iconify-icon icon={icon} width={iconSize}></iconify-icon>
    </button>
  )
}
