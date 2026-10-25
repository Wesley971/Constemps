import type { ReactNode } from 'react'
import type { DeckIcon } from '../../types/deck'

// Symboles de deck (CON-92, planche S25 variante I « Symboles d'origine à
// l'encre ») : SVG maison sur une grille de 24, trait arrondi. Les identifiants
// sont les valeurs déjà en base (anciens noms Phosphor), sans migration. Livre,
// code, notes et palette viennent de la rangée I ; globe, ampoule, fiole et
// calculatrice de la rangée du haut de S25-icones. Tracés repris tels quels.
const SYMBOL_PATHS: Record<DeckIcon, ReactNode> = {
  'ph:book-bold': (
    <>
      <path d="M12 6.6c-2.1-1.6-5.1-2.2-8-1.8v12.5c2.9-.4 5.9.2 8 1.8 2.1-1.6 5.1-2.2 8-1.8V4.8c-2.9-.4-5.9.2-8 1.8z" />
      <path d="M12 6.6v12.5" />
    </>
  ),
  'ph:code-bold': (
    <>
      <path d="M8.4 7.4 3.9 12l4.5 4.6" />
      <path d="M15.6 7.4 20.1 12l-4.5 4.6" />
      <path d="M13.5 5.3 10.5 18.7" />
    </>
  ),
  'ph:globe-bold': (
    <>
      <circle cx="12" cy="12" r="8.1" />
      <path d="M4.4 9.4h15.2M4.4 14.6h15.2" />
      <path d="M12 3.9c-2.5 2.3-3.5 5.1-3.5 8.1s1 5.8 3.5 8.1c2.5-2.3 3.5-5.1 3.5-8.1s-1-5.8-3.5-8.1z" />
    </>
  ),
  'ph:music-notes-bold': (
    <>
      <path d="M9.2 17.3V6.6l9.6-2.1v10.6" />
      <circle cx="6.9" cy="17.4" r="2.3" />
      <circle cx="16.5" cy="15.2" r="2.3" />
    </>
  ),
  'ph:lightbulb-bold': (
    <>
      <path d="M9.3 17.2h5.4M10.2 20.1h3.6" />
      <path d="M12 3.6a5.9 5.9 0 0 0-3.5 10.6c.6.5 1 1.2 1 2v1h5v-1c0-.8.4-1.5 1-2A5.9 5.9 0 0 0 12 3.6z" />
    </>
  ),
  'ph:flask-bold': (
    <>
      <path d="M9.4 3.7h5.2" />
      <path d="M10.5 3.7v5.1l-5 8.8c-.8 1.4.2 2.8 1.8 2.8h9.4c1.6 0 2.6-1.4 1.8-2.8l-5-8.8V3.7" />
      <path d="M7.7 14.3h8.6" />
    </>
  ),
  'ph:calculator-bold': (
    <>
      <rect x="5.9" y="3.6" width="12.2" height="16.8" rx="2.2" />
      <path d="M8.9 7.6h6.2" />
      <path d="M9 12h.01M12 12h.01M15 12h.01M9 15.6h.01M12 15.6h.01M15 15.6h.01" strokeWidth="2.4" />
    </>
  ),
  'ph:palette-bold': (
    <>
      <path d="M12 3.8c-4.6 0-8.3 3.5-8.3 7.9s3.5 7.8 7.9 7.8c1.2 0 1.8-.8 1.6-1.8-.2-1 .4-2 1.5-2h2.2c2.1 0 3.4-1.5 3.4-3.6 0-4.5-3.7-8.3-8.3-8.3z" />
      <path d="M8.2 10.4h.01M11.5 7.6h.01M15.5 9.2h.01" strokeWidth="2.6" />
    </>
  ),
}

const INK_FILTER_ID = 'deck-symbol-ink'

// Filtre d'encre des symboles, défini une seule fois dans la page (monté par
// App) : trait légèrement irrégulier, comme peint (valeurs de la planche).
export function InkFilter() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute">
      <defs>
        <filter id={INK_FILTER_ID} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={1.3} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

interface DeckSymbolProps {
  icon: DeckIcon
  // Taille en px : 14 dans le cercle, 66 pour une plaquette de 104 px de large.
  size: number
  strokeWidth: number
  // À l'encre (plaquettes) ou au trait net (sélecteur du rideau).
  ink?: boolean
  className?: string
}

// Symbole décoratif (aria-hidden) : la couleur vient de currentColor.
export function DeckSymbol({ icon, size, strokeWidth, ink = false, className }: DeckSymbolProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`block overflow-visible ${className ?? ''}`}
    >
      <g filter={ink ? `url(#${INK_FILTER_ID})` : undefined}>{SYMBOL_PATHS[icon]}</g>
    </svg>
  )
}

// Écho du symbole dans le coin bas droit du bois (planche : 66 px pour une
// plaquette de 104 px, trait 1,875, opacité 0,22, rotation -12°, débordant de
// 12 px à droite et 10 px en bas, coupé par la forme de la plaquette). Cotes
// de la planche, hors grille de 4 px, ramenées à la largeur de la plaquette.
// Positionné : il ne prend aucune place dans la plaquette (ni écart ni décalage).
export function DeckSymbolEcho({ icon, plaqueWidth, className }: { icon: DeckIcon; plaqueWidth: number; className?: string }) {
  const k = plaqueWidth / 104
  return (
    <span aria-hidden="true" className={`absolute opacity-22 -rotate-12 ${className ?? ''}`} style={{ right: -12 * k, bottom: -10 * k }}>
      <DeckSymbol icon={icon} size={66 * k} strokeWidth={1.875} ink />
    </span>
  )
}
