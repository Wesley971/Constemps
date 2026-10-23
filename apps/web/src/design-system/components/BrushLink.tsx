import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { BrushStroke } from './BrushStroke'

type BrushLinkSize = 'lg' | 'md'

interface BrushLinkProps {
  children: ReactNode
  // Destination : rendu en lien. Sans destination, onClick : rendu en bouton.
  to?: string
  onClick?: () => void
  size?: BrushLinkSize
  delayMs?: number
  // Action indisponible (deck sans carte) : rendu en bouton désactivé, atténué.
  disabled?: boolean
}

const textSizes: Record<BrushLinkSize, string> = {
  lg: 'text-display-md',
  md: 'text-body-lg font-bold',
}

const chevronSizes: Record<BrushLinkSize, string> = {
  lg: 'size-5',
  md: 'size-4',
}

// Action principale sans bouton (CON-57) : texte Kaisei, chevron au pinceau,
// souligné d'un trait de pinceau. Cible tactile d'au moins 44px.
export function BrushLink({ children, to, onClick, size = 'lg', delayMs = 0, disabled }: BrushLinkProps) {
  const className =
    'self-start inline-flex flex-col justify-center min-h-hit px-0 py-2 text-indigo no-underline hover:no-underline hover:text-indigo-deep bg-transparent border-none cursor-pointer'
  const content = (
    <>
      <span className={`inline-flex items-center gap-1 font-display ${textSizes[size]}`}>
        {children}
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`${chevronSizes[size]} -scale-x-100`} fill="currentColor">
          <path d="M15.6 3.9C13 6.4 10.4 9 7.7 11.4c-.6.5-.6 1.1 0 1.6 2.7 2.4 5.3 4.9 7.6 7.4.5.5 1.1 0 .8-.6-1.9-2.5-4-4.9-6.2-7.4 2.3-2.4 4.7-4.9 6.6-7.5.4-.6-.3-1.4-.9-1z" />
        </svg>
      </span>
      <BrushStroke className="w-full h-2" delayMs={delayMs} muted={size === 'md'} />
    </>
  )

  if (disabled) {
    return (
      <button type="button" disabled className={`${className} opacity-50 cursor-default hover:text-indigo`}>
        {content}
      </button>
    )
  }
  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  )
}
