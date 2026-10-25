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
  // Palier du jour atteint, avec au moins une carte faite aujourd'hui (CON-87).
  dailyGoalReached?: boolean
  // Cartes encore dues aujourd'hui (CON-87), même valeur que le canContinue de
  // la révision : sans elles, un palier atteint ne propose plus « Réviser ».
  canContinue?: boolean
  // Renvoyés par GET /decks (CON-68) : palier du jour, déjà ramené aux cartes
  // disponibles par l'API (même calcul que la révision, CON-87), cartes
  // révisées aujourd'hui, cartes dues maintenant.
  dailyGoal?: number
  reviewedToday?: number
  dueCardsCount?: number
}
