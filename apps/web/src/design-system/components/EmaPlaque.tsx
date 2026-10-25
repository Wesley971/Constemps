import { Link } from 'react-router-dom'
import type { DeckColor } from '../../types/deck'
import { DECK_COLOR_BAND, deckSymbolClass, deckThreadClass, isDeckIcon } from '../constants'
import { BrushCircle } from './BrushCircle'
import { DeckSymbol, DeckSymbolEcho } from './DeckSymbol'

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
  // Couleur du deck : fin liseré en haut de la plaquette (S18-nouveau-deck).
  color?: DeckColor | null
  // Icône du deck (CON-92) : symbole au centre du cercle et son écho pâle dans le
  // coin du bois. Sans icône (ou valeur inconnue), la plaquette ne change pas.
  icon?: string | null
  closeKey?: string
  delayMs?: number
  // Deck favori (CON-74) : dit dans le libellé. Le nœud est noué sur le fil par
  // DeckRope ; le bouton est sur la page du deck (pas de bouton dans un lien).
  favorite?: boolean
}

// Plaquette ema en bois (CON-57) : pentagone, cercle de progression, nom en
// Kaisei, état du jour. Le fil et le balancement sont portés par DeckRope.
export function EmaPlaque({ to, name, status, progress, total, color, icon, closeKey, delayMs, favorite }: EmaPlaqueProps) {
  const symbol = isDeckIcon(icon) ? icon : null
  // Avec un symbole, les textes passent au-dessus de son écho (positionné).
  const above = symbol ? 'relative' : ''
  return (
    <Link
      to={to}
      aria-label={[name, favorite ? 'favori' : null, status, total].filter(Boolean).join(', ')}
      className="block drop-shadow-ema no-underline hover:no-underline focus-visible:outline-offset-4"
    >
      <span
        data-surface="paper"
        className={`ema-shape w-26 pt-6 px-2 flex flex-col items-center bg-wood text-wood-ink text-center ${total ? 'h-37 pb-2 gap-1' : 'h-32 pb-0 gap-2'} ${color ? DECK_COLOR_BAND[color] : ''} ${above}`}
      >
        {symbol ? <DeckSymbolEcho icon={symbol} plaqueWidth={104} className={deckSymbolClass(color)} /> : null}
        <BrushCircle value={progress} size="sm" label={status} closeKey={closeKey} delayMs={delayMs}>
          {symbol ? <DeckSymbol icon={symbol} size={14} strokeWidth={2.5} ink className={deckSymbolClass(color)} /> : null}
        </BrushCircle>
        <span className={`font-display text-body-sm font-bold line-clamp-2 break-words w-full ${above}`}>{name}</span>
        <span className={`text-micro font-normal text-wood-ink-soft ${above}`}>{status}</span>
        {total ? <span className={`mt-auto text-micro font-normal text-wood-ink-faint ${above}`}>{total}</span> : null}
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
  color?: DeckColor | null
  // Icône du deck (CON-92) : seulement l'écho dans le coin, le cercle garde son chiffre.
  icon?: string | null
  closeKey?: string
}

// Grande plaquette de l'intérieur d'un deck (S15-deck) : accrochée à un clou,
// même compteur que les plaquettes de la corde, chiffre écrit dans le cercle.
export function DeckPlaque({ remaining, status, label, progress, color, icon, closeKey }: DeckPlaqueProps) {
  const symbol = isDeckIcon(icon) ? icon : null
  const above = symbol ? 'relative' : ''
  return (
    <div className="flex flex-col items-center shrink-0 origin-top animate-sway drop-shadow-ema">
      <span aria-hidden="true" className="size-2 rounded-full bg-rope" />
      <span aria-hidden="true" className={`w-thread h-3 ${deckThreadClass(color)}`} />
      <span data-surface="paper" className={`ema-shape w-27 h-33 pt-8 px-2 pb-2 flex flex-col items-center gap-2 bg-wood text-wood-ink text-center ${color ? DECK_COLOR_BAND[color] : ''} ${above}`}>
        {symbol ? <DeckSymbolEcho icon={symbol} plaqueWidth={108} className={deckSymbolClass(color)} /> : null}
        <BrushCircle value={progress} size="deck" label={label} closeKey={closeKey}>
          {remaining > 0 ? <span className="font-display text-display-sm">{remaining}</span> : null}
        </BrushCircle>
        {/* Déjà lu dans le libellé du cercle. */}
        <span aria-hidden="true" className={`text-caption text-wood-ink-soft ${above}`}>
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
