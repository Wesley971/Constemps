import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonVariant = 'primary' | 'dark' | 'ghost' | 'ghost-on-dark' | 'danger'

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  icon?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  style?: CSSProperties
}

interface LinkButtonProps {
  children: ReactNode
  to: string
  variant?: ButtonVariant
  icon?: string
  style?: CSSProperties
}

const base: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 13.5,
  padding: '10px 20px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid transparent',
  cursor: 'pointer',
  transition: 'background .2s ease, color .2s ease, border-color .2s ease',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

const variants: Record<ButtonVariant, CSSProperties> = {
  primary: { background: 'var(--teal)', color: '#fff', boxShadow: 'var(--shadow-glow-teal)' },
  dark: { background: 'var(--ink)', color: '#fff' },
  ghost: { background: 'transparent', color: 'var(--ink)', borderColor: 'var(--line)' },
  'ghost-on-dark': { background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.16)' },
  danger: { background: 'var(--danger)', color: '#fff' },
}

export function Button({ children, variant = 'primary', icon, type = 'button', disabled, onClick, style }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...variants[variant], opacity: disabled ? 0.6 : 1, cursor: disabled ? 'default' : 'pointer', ...style }}
    >
      {icon ? <iconify-icon icon={icon} width="16"></iconify-icon> : null}
      {children}
    </button>
  )
}

export function LinkButton({ children, to, variant = 'ghost', icon, style }: LinkButtonProps) {
  return (
    <Link to={to} style={{ ...base, ...variants[variant], ...style }}>
      {icon ? <iconify-icon icon={icon} width="16"></iconify-icon> : null}
      {children}
    </Link>
  )
}
