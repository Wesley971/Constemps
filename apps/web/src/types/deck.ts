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
  // Quelque chose à réviser aujourd'hui (CON-87, CON-88) : une carte due et le
  // palier étendu pas atteint. Même valeur que le canContinue de la révision ;
  // sans elle, ni « Réviser » ni « Continuer aujourd'hui ».
  canContinue?: boolean
  // Prochaine carte pas encore disponible, en journées de l'app (CON-90) :
  // 1 pour demain. null sans carte à venir.
  nextDueInDays?: number | null
  // Renvoyés par GET /decks (CON-68) : palier du jour, déjà ramené aux cartes
  // disponibles par l'API (même calcul que la révision, CON-87), cartes
  // révisées aujourd'hui, cartes dues maintenant.
  dailyGoal?: number
  reviewedToday?: number
  dueCardsCount?: number
}
