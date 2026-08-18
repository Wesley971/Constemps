import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import logoLockup from '../../assets/logo-lockup.svg'

interface AppHeaderProps {
  actions?: ReactNode
}

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/decks', label: 'Mes decks' },
]

export function AppHeader({ actions }: AppHeaderProps) {
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
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  )
}
