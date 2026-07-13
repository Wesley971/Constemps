export type CardType = 'CLASSIC' | 'OPEN_QUESTION'

export interface Card {
  id: string
  deckId: string
  type: CardType
  front: string
  back: string
  stability: number
  difficulty: number
  due: string
  lapses: number
  reps: number
  state: number
  audioUrl: string | null
  createdAt: string
}
