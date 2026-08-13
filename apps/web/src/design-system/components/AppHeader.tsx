import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import logoLockup from '../../assets/logo-lockup.svg'

interface AppHeaderProps {
  actions?: ReactNode
}

export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 px-1 pt-1 pb-5">
      <Link to="/decks" className="flex items-center text-ink">
        <img src={logoLockup} alt="Constemps" className="block h-8.5 w-auto" />
      </Link>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  )
}
