import { Link } from 'react-router-dom'
import { BrushCircle } from './BrushCircle'

interface EmaPlaqueProps {
  to: string
  name: string
  // Texte sous le nom, ex. « 11 à revoir », « Palier atteint », « À jour ».
  status: string
  // Progression du cercle, de 0 à 100 ; fermé à 100.
  progress: number
  // Petit total en pied de plaquette, ex. « 48 cartes » (Mes decks, S14-decks).
  // La plaquette passe alors de 128 à 148px de haut (136 sur la planche, trop
  // court pour un nom en Kaisei sur deux lignes).
  total?: string
  closeKey?: string
  delayMs?: number
}

// Plaquette ema en bois (CON-57) : pentagone, cercle de progression, nom en
// Kaisei, état du jour. Le fil et le balancement sont portés par DeckRope.
export function EmaPlaque({ to, name, status, progress, total, closeKey, delayMs }: EmaPlaqueProps) {
  return (
    <Link
      to={to}
      aria-label={total ? `${name}, ${status}, ${total}` : `${name}, ${status}`}
      className="block drop-shadow-ema no-underline hover:no-underline focus-visible:outline-offset-4"
    >
      <span
        className={`ema-shape w-26 pt-6 px-2 flex flex-col items-center bg-wood text-wood-ink text-center ${total ? 'h-37 pb-2 gap-1' : 'h-32 pb-0 gap-2'}`}
      >
        <BrushCircle value={progress} size="sm" label={status} closeKey={closeKey} delayMs={delayMs} />
        <span className="font-display text-body-sm font-bold line-clamp-2 break-words w-full">{name}</span>
        <span className="text-micro font-normal text-wood-ink-soft">{status}</span>
        {total ? <span className="mt-auto text-micro font-normal text-wood-ink-faint">{total}</span> : null}
      </span>
    </Link>
  )
}

interface DeckPlaqueProps {
  // Restantes du jour, écrites dans le cercle tant qu'il en reste.
  remaining: number
  // Texte sous le cercle : « à revoir », « Palier atteint » ou « À jour ».
  status: string
  // Libellé complet lu par les lecteurs d'écran, ex. « 2 à revoir ».
  label: string
  progress: number
  closeKey?: string
}

// Grande plaquette de l'intérieur d'un deck (S15-deck) : accrochée à un clou,
// même compteur que les plaquettes de la corde, chiffre écrit dans le cercle.
export function DeckPlaque({ remaining, status, label, progress, closeKey }: DeckPlaqueProps) {
  return (
    <div className="flex flex-col items-center shrink-0 origin-top animate-sway drop-shadow-ema">
      <span aria-hidden="true" className="size-2 rounded-full bg-rope" />
      <span aria-hidden="true" className="w-thread h-3 bg-vermillon" />
      <span className="ema-shape w-27 h-33 pt-8 px-2 pb-2 flex flex-col items-center gap-2 bg-wood text-wood-ink text-center">
        <BrushCircle value={progress} size="deck" label={label} closeKey={closeKey}>
          {remaining > 0 ? <span className="font-display text-display-sm">{remaining}</span> : null}
        </BrushCircle>
        {/* Déjà lu dans le libellé du cercle. */}
        <span aria-hidden="true" className="text-caption text-wood-ink-soft">
          {status}
        </span>
      </span>
    </div>
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
