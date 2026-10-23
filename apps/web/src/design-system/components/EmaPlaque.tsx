import { Link } from 'react-router-dom'
import { BrushCircle } from './BrushCircle'

interface EmaPlaqueProps {
  to: string
  name: string
  // Texte sous le nom, ex. « 11 à revoir », « Palier atteint », « À jour ».
  status: string
  // Progression du cercle, de 0 à 100 ; fermé à 100.
  progress: number
  closeKey?: string
  delayMs?: number
}

// Plaquette ema en bois (CON-57) : pentagone, cercle de progression, nom en
// Kaisei, état du jour. Le fil et le balancement sont portés par DeckRope.
export function EmaPlaque({ to, name, status, progress, closeKey, delayMs }: EmaPlaqueProps) {
  return (
    <Link
      to={to}
      aria-label={`${name}, ${status}`}
      className="block drop-shadow-ema no-underline hover:no-underline focus-visible:outline-offset-4"
    >
      <span className="ema-shape w-26 h-32 pt-6 px-2 pb-0 flex flex-col items-center gap-2 bg-wood text-wood-ink text-center">
        <BrushCircle value={progress} size="sm" label={status} closeKey={closeKey} delayMs={delayMs} />
        <span className="font-display text-body-sm font-bold line-clamp-2 break-words w-full">{name}</span>
        <span className="text-micro font-normal text-wood-ink-soft">{status}</span>
      </span>
    </Link>
  )
}

// Dernière plaquette de la corde : « Nouveau deck », en pointillés.
export function NewDeckPlaque({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-26 h-32 px-0 pt-4 pb-0 flex flex-col items-center justify-center gap-2 text-indigo bg-transparent border-none cursor-pointer focus-visible:outline-offset-4"
    >
      <svg viewBox="0 0 104 128" aria-hidden="true" className="absolute inset-0 size-full">
        <path
          d="M52 1.5 L102.5 26 L102.5 126.5 L1.5 126.5 L1.5 26 Z"
          className="fill-wood-veil stroke-rope"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
      </svg>
      <span aria-hidden="true" className="relative font-display text-display-md">
        +
      </span>
      <span className="relative text-label text-center">
        Nouveau
        <br />
        deck
      </span>
    </button>
  )
}
