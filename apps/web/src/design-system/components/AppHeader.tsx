import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AppHeaderProps {
  actions?: ReactNode
}

export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 4px 20px',
      }}
    >
      <Link to="/decks" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink)' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--ink)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          CT
        </div>
        <span style={{ font: 'var(--text-display-sm)', letterSpacing: 'var(--tracking-tight)', color: 'var(--ink)' }}>
          Constemps
        </span>
      </Link>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{actions}</div>}
    </div>
  )
}
