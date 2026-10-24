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
  createdAt: string
  // Favori (CON-74) : listé avant les autres decks, partout.
  isFavorite: boolean
  cardCount?: number
  dailyGoalReached?: boolean
  // Renvoyés par GET /decks (CON-68) : palier du jour (même règle que la
  // révision), cartes révisées aujourd'hui, cartes dues maintenant.
  dailyGoal?: number
  reviewedToday?: number
  dueCardsCount?: number
}
