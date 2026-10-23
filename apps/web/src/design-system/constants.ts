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

// Sous-ensemble des teintes déjà définies dans design-system/tokens.css, réutilisées
// comme couleurs de personnalisation de deck. "vermillon" est volontairement exclu :
// réservé aux accents (étiquettes, palier atteint : MilestoneBanner / ProgressBar
// tone="positive").
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

// Notation d'une révision (ReviewLog.rating, échelle FSRS 1 à 4), mêmes mots
// dans la révision et dans les stats (CON-69). « à revoir » est réservé aux
// cartes restantes du palier du jour.
export const RATING_LABELS: Record<number, string> = {
  1: 'Encore',
  2: 'Difficile',
  3: 'Correct',
  4: 'Facile',
}

// Verdict de l'IA sur une carte Avis assisté (ReviewLog.aiVerdict).
export const VERDICT_LABELS: Record<string, string> = {
  compris: 'Compris',
  partiellement: 'Partiellement compris',
  incompris: 'Incompris',
}
