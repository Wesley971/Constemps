import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  interactive?: boolean
  className?: string
}

export function Card({ children, interactive = false, className }: CardProps) {
  return (
    <div
      className={`bg-white border border-line rounded-tile shadow-soft ${
        interactive ? 'transition-[transform,box-shadow] duration-tile ease-bounce hover:-translate-y-1 hover:shadow-lift' : ''
      } ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
