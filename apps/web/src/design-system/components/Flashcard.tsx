import type { ReactNode } from 'react'
import { Card } from './Card'

interface FlashcardProps {
  front: ReactNode
  back?: ReactNode
  revealed: boolean
  onReveal?: ReactNode
  ratingButtons?: ReactNode
  audioAction?: ReactNode
  children?: ReactNode
}

/**
 * Flashcard — carte de révision recto/verso. Affiche le recto ; révèle le verso
 * plus une rangée de notation manuelle (classique), ou laisse `children` gérer
 * le mode question ouverte (textarea + verdict IA).
 */
export function Flashcard({ front, back, revealed, onReveal, ratingButtons, audioAction, children }: FlashcardProps) {
  return (
    <Card className="p-10 text-center">
      <div className="flex items-center justify-center gap-2.5 mb-5">
        <h2 className="font-display text-display-md text-ink tracking-tight m-0">{front}</h2>
        {audioAction}
      </div>
      {!revealed ? (
        onReveal
      ) : (
        <div>
          {back ? <p className="font-body text-body-md text-inksoft m-0 mb-7">{back}</p> : null}
          {ratingButtons ? <div className="flex gap-2.5 justify-center flex-wrap">{ratingButtons}</div> : null}
          {children}
        </div>
      )}
    </Card>
  )
}
