import { Link } from 'react-router-dom'
import { Card } from './Card'
import { IconCircleButton } from './IconCircleButton'

interface DeckCardProps {
  name: string
  cardCount: number
  to: string
  onDelete?: () => void
}

export function DeckCard({ name, cardCount, to, onDelete }: DeckCardProps) {
  return (
    <Card interactive className="relative p-5 flex flex-col gap-3.5 min-h-27">
      <Link to={to} aria-label={name} className="absolute inset-0 rounded-lg" />
      <span className="font-display text-display-sm text-ink tracking-tight">{name}</span>
      <div className="mt-auto flex items-center justify-between">
        <span className="font-body text-body-sm text-inkfaint">
          {cardCount} card{cardCount === 1 ? '' : 's'}
        </span>
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
    </Card>
  )
}
