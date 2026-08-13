import { Link } from 'react-router-dom'
import type { DeckColor, DeckIcon } from '../../types/deck'
import { Card } from './Card'
import { IconCircleButton } from './IconCircleButton'
import { DECK_COLOR_CARD_BG, DECK_COLOR_ICON_TEXT } from '../constants'

interface DeckCardProps {
  name: string
  cardCount: number
  to: string
  color?: DeckColor | null
  icon?: DeckIcon | null
  onEdit?: () => void
  onDelete?: () => void
}

export function DeckCard({ name, cardCount, to, color, icon, onEdit, onDelete }: DeckCardProps) {
  return (
    <Card interactive className={`relative p-5 flex flex-col gap-3.5 min-h-27 ${color ? DECK_COLOR_CARD_BG[color] : ''}`}>
      <Link to={to} aria-label={name} className="absolute inset-0 rounded-lg" />
      <div className="flex items-center gap-2">
        {icon ? (
          // Nudge de -2px : le glyphe Phosphor est géométriquement centré dans sa boîte,
          // mais le texte adjacent (Newsreader) réserve de l'espace sous la ligne de base
          // pour les descendantes (g/p/q) que la plupart des noms de deck n'utilisent pas.
          // Sans ce correctif, l'icône paraît décalée trop bas par rapport au texte visible.
          <span className={`shrink-0 flex items-center -translate-y-0.5 ${color ? DECK_COLOR_ICON_TEXT[color] : 'text-inkfaint'}`}>
            <iconify-icon icon={icon} width="18"></iconify-icon>
          </span>
        ) : null}
        <span className="font-display text-display-sm text-ink tracking-tight">{name}</span>
      </div>
      <div className="mt-auto flex items-center justify-between">
        <span className="font-body text-body-sm text-inkfaint">
          {cardCount} card{cardCount === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-1.5">
          <IconCircleButton
            icon="ph:pencil-simple-bold"
            tone="ghost"
            size="md"
            title="Modifier"
            className="relative z-10"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.()
            }}
          />
          <IconCircleButton
            icon="ph:trash-bold"
            tone="ghost"
            size="md"
            title="Supprimer"
            className="relative z-10"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.()
            }}
          />
        </div>
      </div>
    </Card>
  )
}
