import type { CSSProperties } from 'react'

interface FavoriteKnotProps {
  filled?: boolean
  // Les boucles se resserrent (mise en favori seulement).
  tighten?: boolean
  className?: string
  style?: CSSProperties
}

// Nœud du favori (CON-74) : boucle double et deux brins qui pendent, au trait des
// icônes de l'app (grille de 24, bouts arrondis). Au trait fin hors favori ; plein,
// plus épais et avec un point au centre en favori. La couleur vient de la classe
// text-* passée : couleur du deck, éclaircie la nuit comme la cordelette (voir
// deckKnotClass), ou celle du parent au trait fin. Le point prend on-accent, clair
// en jour et sombre la nuit, sur la couleur du nœud.
// Décoratif : l'état est dit par le libellé qui l'accompagne.
export function FavoriteKnot({ filled = false, tighten = false, className = '', style }: FavoriteKnotProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${tighten ? 'knot-tighten' : ''} ${className}`}
      style={style}
      stroke="currentColor"
      strokeWidth={filled ? 2.4 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M12 9C9.5 4.5 3.5 3.5 3.5 7.5S9 11.5 12 9M12 9c2.5-4.5 8.5-5.5 8.5-1.5S15 11.5 12 9" fill={filled ? 'currentColor' : 'none'} />
      <path d="M11 10.5c-.5 3.5-1.5 7-3 10M13 10.5c.5 3.5 1.5 7 3 10" />
      <circle cx="12" cy="9" r={filled ? 2.4 : 2} fill={filled ? 'currentColor' : 'none'} />
      {filled ? <circle cx="12" cy="9" r="1.1" className="fill-on-accent" stroke="none" /> : null}
    </svg>
  )
}
