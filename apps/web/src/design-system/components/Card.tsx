import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  interactive?: boolean
  style?: CSSProperties
}

export function Card({ children, interactive = false, style }: CardProps) {
  return (
    <div
      className={interactive ? 'tile' : undefined}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-tile)',
        boxShadow: 'var(--shadow-soft)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
