import type { CardType } from '../types/card'
import type { DeckColor, DeckIcon } from '../types/deck'

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  CLASSIC: 'Appréciation personnelle',
  OPEN_QUESTION: 'Avis assisté',
}

// Icône distinctive par type de card, réutilisée partout où le type est affiché
// (radio de sélection, badges sur les cards, propositions générées). "sparkle"
// reprend l'icône déjà utilisée pour "Générer des cards depuis un texte" (IA).
export const CARD_TYPE_ICONS: Record<CardType, string> = {
  CLASSIC: 'ph:pencil-simple-bold',
  OPEN_QUESTION: 'ph:sparkle-bold',
}

export const CARD_TYPE_HELP: Record<CardType, string> = {
  CLASSIC: 'Tu notes toi-même ta réponse (comme Anki).',
  OPEN_QUESTION: 'Ton IA évalue ta réponse rédigée et te donne un retour.',
}

// Sous-ensemble des teintes déjà définies dans tailwind.config.js, réutilisées comme
// couleurs de personnalisation de deck. "clay" est volontairement exclu : réservé à
// l'état "palier atteint" (MilestoneBanner / ProgressBar tone="positive").
export const DECK_COLORS: DeckColor[] = ['indigo', 'success', 'warning', 'danger']

export const DECK_COLOR_LABELS: Record<DeckColor, string> = {
  indigo: 'Indigo',
  success: 'Sauge',
  warning: 'Sable',
  danger: 'Terracotta',
}

export const DECK_COLOR_SWATCH: Record<DeckColor, string> = {
  indigo: 'bg-indigo',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

// Teinte de fond appliquée à toute la surface de DeckCard. Le "!" force la priorité
// sur le bg-paper par défaut du composant Card (même convention que dans GenerateCardsModal).
export const DECK_COLOR_CARD_BG: Record<DeckColor, string> = {
  indigo: 'bg-indigo-tint!',
  success: 'bg-success-tint!',
  warning: 'bg-warning-tint!',
  danger: 'bg-danger-tint!',
}

export const DECK_COLOR_ICON_TEXT: Record<DeckColor, string> = {
  indigo: 'text-indigo-deep',
  success: 'text-success-deep',
  warning: 'text-warning-deep',
  danger: 'text-danger-deep',
}

// Sélection Phosphor (poids bold) volontairement restreinte, pertinente pour des
// sujets d'apprentissage courants. Miroir de la liste back (decks/deck-icons.ts).
export const DECK_ICONS: DeckIcon[] = [
  'ph:book-bold',
  'ph:code-bold',
  'ph:globe-bold',
  'ph:music-notes-bold',
  'ph:lightbulb-bold',
  'ph:flask-bold',
  'ph:calculator-bold',
  'ph:palette-bold',
]

export const DECK_ICON_LABELS: Record<DeckIcon, string> = {
  'ph:book-bold': 'Langue / lecture',
  'ph:code-bold': 'Dev / tech',
  'ph:globe-bold': 'Culture générale',
  'ph:music-notes-bold': 'Musique',
  'ph:lightbulb-bold': 'Connaissances générales',
  'ph:flask-bold': 'Sciences',
  'ph:calculator-bold': 'Mathématiques',
  'ph:palette-bold': 'Art',
}
