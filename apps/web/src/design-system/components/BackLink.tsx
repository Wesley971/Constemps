import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

// Retour à l'écran parent (CON-57, S15-deck et S15-stats) : chevron au pinceau
// et texte Kaisei indigo, cible tactile de 44px.
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="self-start min-w-0 max-w-full min-h-hit inline-flex items-center gap-1 font-display text-body-md font-bold text-indigo no-underline hover:no-underline hover:text-indigo-deep"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0" fill="currentColor">
        <path d="M15.6 3.9C13 6.4 10.4 9 7.7 11.4c-.6.5-.6 1.1 0 1.6 2.7 2.4 5.3 4.9 7.6 7.4.5.5 1.1 0 .8-.6-1.9-2.5-4-4.9-6.2-7.4 2.3-2.4 4.7-4.9 6.6-7.5.4-.6-.3-1.4-.9-1z" />
      </svg>
      <span className="truncate">{children}</span>
    </Link>
  )
}
