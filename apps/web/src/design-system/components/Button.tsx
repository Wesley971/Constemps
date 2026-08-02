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
  'inline-flex items-center gap-2 font-body font-semibold text-[13.5px] px-5.5 py-2.75 rounded-md border border-transparent transition-colors duration-base ease-standard no-underline whitespace-nowrap min-h-hit'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-indigo text-paper hover:bg-indigo-deep',
  dark: 'bg-ink text-paper hover:bg-black',
  ghost: 'bg-transparent text-ink border-line hover:bg-paper-sunken',
  'ghost-on-dark': 'bg-paper/10 text-paper border-paper/22 hover:bg-paper/18',
  danger: 'bg-danger text-paper hover:bg-danger-deep',
}

export function Button({ children, variant = 'primary', icon, type = 'button', disabled, onClick, className }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${disabled ? 'opacity-50 cursor-default' : 'cursor-pointer'} ${className ?? ''}`}
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
