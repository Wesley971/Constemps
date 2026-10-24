import type { ReactNode } from 'react'
import { BrushCircle } from './BrushCircle'

interface LanternProps {
  // Progression du cercle, de 0 à 100.
  value: number
  label: string
  tone?: 'indigo' | 'vermillon'
  // Identifiant du cercle pour ne jouer sa fermeture qu'une fois par jour.
  closeKey?: string
  // Journée close : halo qui pulse (S14-close) ; en nuit, papier plus clair aussi.
  lit?: boolean
  children?: ReactNode
}

// Lanterne en papier allumée (accueil, CON-68) : se balance doucement, porte au
// centre le cercle au pinceau du palier du jour. Objet clair : encre du jour dans
// les deux thèmes (data-surface, CON-73).
export function Lantern({ value, label, tone = 'indigo', closeKey, lit, children }: LanternProps) {
  return (
    <div data-surface="paper" className="shrink-0 flex flex-col items-center origin-top animate-sway">
      <span aria-hidden="true" className="w-thread h-4 bg-rope" />
      <span aria-hidden="true" className="w-11 h-2 rounded-xs bg-lantern-cap" />
      <div
        className={`relative w-28 h-30 rounded-lantern overflow-hidden flex items-center justify-center shadow-lantern bg-radial from-lantern-core via-lantern-mid to-lantern-edge ${lit ? 'lantern-lit' : ''}`}
      >
        <span aria-hidden="true" className="lantern-ribs absolute inset-0" />
        <BrushCircle value={value} size="md" tone={tone} label={label} closeKey={closeKey} delayMs={500}>
          {children}
        </BrushCircle>
      </div>
      <span aria-hidden="true" className="w-11 h-2 rounded-xs bg-lantern-cap" />
      <span aria-hidden="true" className="w-1 h-4 rounded-b-xs bg-vermillon" />
    </div>
  )
}
