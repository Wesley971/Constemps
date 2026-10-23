import type { ReactNode } from 'react'
import { BrushCircle } from './BrushCircle'

interface LanternProps {
  // Progression du cercle, de 0 à 100.
  value: number
  label: string
  tone?: 'indigo' | 'vermillon'
  // Identifiant du cercle pour ne jouer sa fermeture qu'une fois par jour.
  closeKey?: string
  children?: ReactNode
}

// Lanterne en papier allumée (accueil, CON-68) : se balance doucement, porte au
// centre le cercle au pinceau du palier du jour.
export function Lantern({ value, label, tone = 'indigo', closeKey, children }: LanternProps) {
  return (
    <div className="shrink-0 flex flex-col items-center origin-top animate-sway">
      <span aria-hidden="true" className="w-thread h-4 bg-rope" />
      <span aria-hidden="true" className="w-11 h-2 rounded-xs bg-indigo" />
      <div className="relative w-28 h-30 rounded-lantern overflow-hidden flex items-center justify-center shadow-lantern bg-radial from-lantern-core via-lantern-mid to-lantern-edge">
        <span aria-hidden="true" className="lantern-ribs absolute inset-0" />
        <BrushCircle value={value} size="md" tone={tone} label={label} closeKey={closeKey} delayMs={500}>
          {children}
        </BrushCircle>
      </div>
      <span aria-hidden="true" className="w-11 h-2 rounded-xs bg-indigo" />
      <span aria-hidden="true" className="w-1 h-4 rounded-b-xs bg-vermillon" />
    </div>
  )
}
