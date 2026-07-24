import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AppHeaderProps {
  actions?: ReactNode
}

export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1 pt-1 pb-5">
      <Link to="/decks" className="flex items-center gap-3 text-ink">
        <div className="w-9 h-9 rounded-xs bg-ink text-white flex items-center justify-center font-display font-extrabold text-[13px]">
          CT
        </div>
        <span className="font-display text-display-sm tracking-tight text-ink">Constemps</span>
      </Link>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  )
}
