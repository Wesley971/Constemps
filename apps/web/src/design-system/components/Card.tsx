import type { MouseEventHandler, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  interactive?: boolean
  className?: string
  onClick?: MouseEventHandler<HTMLDivElement>
}

export function Card({ children, interactive = false, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-paper border border-line rounded-lg shadow-1 ${
        interactive ? 'transition-[transform,box-shadow] duration-slow ease-standard hover:-translate-y-0.5 hover:shadow-3' : ''
      } ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
