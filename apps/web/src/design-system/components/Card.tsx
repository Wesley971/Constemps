import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  interactive?: boolean
  className?: string
}

export function Card({ children, interactive = false, className }: CardProps) {
  return (
    <div
      className={`bg-paper border border-line rounded-lg shadow-1 ${
        interactive ? 'transition-[transform,box-shadow] duration-slow ease-standard hover:-translate-y-0.5 hover:shadow-3' : ''
      } ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
