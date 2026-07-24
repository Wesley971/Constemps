import type { MouseEventHandler, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonVariant = 'primary' | 'dark' | 'ghost' | 'ghost-on-dark' | 'danger'

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  icon?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
}

interface LinkButtonProps {
  children: ReactNode
  to: string
  variant?: ButtonVariant
  icon?: string
  className?: string
}

const base =
  'inline-flex items-center gap-2 font-body font-semibold text-[13.5px] px-5 py-2.5 rounded-pill border border-transparent transition-colors duration-base no-underline whitespace-nowrap'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-teal text-white shadow-glow-teal',
  dark: 'bg-ink text-white',
  ghost: 'bg-transparent text-ink border-line',
  'ghost-on-dark': 'bg-white/8 text-white border-white/16',
  danger: 'bg-danger text-white',
}

export function Button({ children, variant = 'primary', icon, type = 'button', disabled, onClick, className }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${disabled ? 'opacity-60 cursor-default' : 'cursor-pointer'} ${className ?? ''}`}
    >
      {icon ? <iconify-icon icon={icon} width="16"></iconify-icon> : null}
      {children}
    </button>
  )
}

export function LinkButton({ children, to, variant = 'ghost', icon, className }: LinkButtonProps) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${className ?? ''}`}>
      {icon ? <iconify-icon icon={icon} width="16"></iconify-icon> : null}
      {children}
    </Link>
  )
}
