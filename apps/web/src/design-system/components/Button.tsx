import type { MouseEventHandler, ReactNode } from 'react'
import { Link } from 'react-router-dom'

// primary : bouton rideau indigo (action principale). secondary : indigo à 10 %.
// curtain / curtain-secondary : mêmes rôles posés sur un rideau indigo (fenêtres,
// série 18). danger : rideau terracotta pour une action destructive. compact :
// action principale à la hauteur d'un bouton secondaire (édition d'une carte).
type ButtonVariant = 'primary' | 'compact' | 'secondary' | 'curtain' | 'curtain-secondary' | 'danger'

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
  'inline-flex items-center justify-center gap-2 border-none no-underline whitespace-nowrap rounded-t-xs transition-colors duration-base ease-standard hover:no-underline'

// Bouton rideau : coins du haut 4px, du bas 20px, Kaisei. Bouton secondaire :
// coins du bas 16px, Zen Maru, cible tactile de 44px.
const shapes = {
  curtain: 'h-button px-6 rounded-b-curtain font-display text-display-sm',
  compact: 'h-hit px-4 rounded-b-md font-body text-body-sm font-bold',
}

const variants: Record<ButtonVariant, string> = {
  primary: `${shapes.curtain} bg-indigo text-on-indigo hover:bg-indigo-deep hover:text-on-indigo`,
  danger: `${shapes.curtain} bg-danger text-on-indigo hover:bg-danger-deep hover:text-on-indigo`,
  curtain: `${shapes.curtain} bg-cream text-cream-ink hover:text-cream-ink`,
  compact: `${shapes.compact} bg-indigo text-on-indigo hover:bg-indigo-deep hover:text-on-indigo`,
  secondary: `${shapes.compact} bg-indigo-tint text-indigo hover:bg-indigo-veil hover:text-indigo`,
  'curtain-secondary': `${shapes.compact} bg-cream-veil text-on-indigo hover:text-on-indigo`,
}

function ButtonIcon({ icon }: { icon?: string }) {
  return icon ? <iconify-icon icon={icon} width="16" aria-hidden="true"></iconify-icon> : null
}

export function Button({ children, variant = 'primary', icon, type = 'button', disabled, onClick, className }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${disabled ? 'opacity-50 cursor-default' : 'cursor-pointer'} ${className ?? ''}`}
    >
      <ButtonIcon icon={icon} />
      {children}
    </button>
  )
}

export function LinkButton({ children, to, variant = 'secondary', icon, className }: LinkButtonProps) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${className ?? ''}`}>
      <ButtonIcon icon={icon} />
      {children}
    </Link>
  )
}
