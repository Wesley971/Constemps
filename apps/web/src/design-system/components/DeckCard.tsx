import { Link } from 'react-router-dom'
import type { DeckColor, DeckIcon } from '../../types/deck'
import { Card } from './Card'
import { IconCircleButton } from './IconCircleButton'
import { BrushCircle } from './BrushCircle'
import { DECK_COLOR_CARD_BG, DECK_COLOR_ICON_TEXT } from '../constants'

interface DeckCardProps {
  name: string
  cardCount: number
  to: string
  color?: DeckColor | null
  icon?: DeckIcon | null
  dailyGoalReached?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function DeckCard({ name, cardCount, to, color, icon, dailyGoalReached = false, onEdit, onDelete }: DeckCardProps) {
  return (
    <Card interactive className={`relative p-5 flex flex-col gap-3.5 min-h-27 ${color ? DECK_COLOR_CARD_BG[color] : ''}`}>
      <Link to={to} aria-label={name} className="absolute inset-0 rounded-lg" />
      <div className="flex items-center gap-2">
        {/* Cercle au pinceau autour de l'icône, fermé au palier atteint (CON-36). La
            plaquette entière sera refaite au lot 3 de CON-57 (CON-69). */}
        {icon ? (
          <span className={`relative z-10 shrink-0 flex ${color ? DECK_COLOR_ICON_TEXT[color] : 'text-inksoft'}`}>
            <BrushCircle value={dailyGoalReached ? 100 : 0} size="sm" tone="vermillon" label={dailyGoalReached ? 'Palier du jour atteint' : 'Palier du jour en cours'}>
              <iconify-icon icon={icon} width="18" aria-hidden="true"></iconify-icon>
            </BrushCircle>
          </span>
        ) : dailyGoalReached ? (
          // Deck sans icône choisie : le cercle reste le seul indicateur, sans glyphe dedans.
          <span className="relative z-10 shrink-0 flex">
            <BrushCircle value={100} size="sm" tone="vermillon" label="Palier du jour atteint" />
          </span>
        ) : null}
        <span className="font-display text-display-sm text-ink tracking-tight">{name}</span>
      </div>
      <div className="mt-auto flex items-center justify-between">
        <span className="font-body text-body-sm text-inksoft">
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
