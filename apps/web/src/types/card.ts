export type CardType = 'CLASSIC' | 'OPEN_QUESTION'

export interface GeneratedCard {
  type: CardType
  front: string
  back: string
  // Phrase d'exemple proposée par l'IA (CON-77), null si aucune.
  example: string | null
}

export interface Card {
  id: string
  deckId: string
  type: CardType
  front: string
  back: string
  // Phrase d'exemple facultative (CON-77), montrée en révision avec le verso.
  example: string | null
  stability: number
  difficulty: number
  due: string
  lapses: number
  reps: number
  state: number
  createdAt: string
}
