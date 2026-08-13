export type DeckColor = 'indigo' | 'success' | 'warning' | 'danger'

export type DeckIcon =
  | 'ph:book-bold'
  | 'ph:code-bold'
  | 'ph:globe-bold'
  | 'ph:music-notes-bold'
  | 'ph:lightbulb-bold'
  | 'ph:flask-bold'
  | 'ph:calculator-bold'
  | 'ph:palette-bold'

export interface Deck {
  id: string
  name: string
  color: DeckColor | null
  icon: DeckIcon | null
  userId: string
  dailyGoal: number
  createdAt: string
  cardCount?: number
}
