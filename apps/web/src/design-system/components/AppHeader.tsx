import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import logoLockup from '../../assets/logo-lockup.svg'

interface AppHeaderProps {
  actions?: ReactNode
  email?: string
}

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/decks', label: 'Mes decks' },
]

function getInitials(email: string): string {
  const localPart = email.split('@')[0] ?? email
  return localPart.slice(0, 2).toUpperCase()
}

export function AppHeader({ actions, email }: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 px-1 pt-1 pb-5">
      <div className="flex items-center gap-6 flex-wrap">
        <Link to="/dashboard" className="flex items-center text-ink">
          <img src={logoLockup} alt="Constemps" className="block h-8.5 w-auto" />
        </Link>
        <nav className="flex items-center gap-4.5">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `font-body text-label ${isActive ? 'font-semibold text-ink no-underline' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
      {(actions || email) && (
        <div className="flex items-center gap-3">
          {actions}
          {email && (
            <Link
              to="/profile"
              aria-label="Voir mon profil"
              title={email}
              className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-indigo text-paper no-underline font-body text-label font-semibold"
            >
              {getInitials(email)}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
