import type { CardType } from '../types/card'
import type { DeckColor } from '../types/deck'

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  CLASSIC: 'Appréciation personnelle',
  OPEN_QUESTION: 'Avis assisté',
}

export const CARD_TYPE_HELP: Record<CardType, string> = {
  CLASSIC: 'Tu notes toi-même ta réponse.',
  OPEN_QUESTION: 'L’IA évalue ta réponse rédigée.',
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

// Pastille du choix, fil de la plaquette (CON-70) : couleurs dédiées aux decks,
// que le rideau ne redéfinit pas.
export const DECK_COLOR_SWATCH: Record<DeckColor, string> = {
  indigo: 'bg-deck-indigo',
  success: 'bg-deck-sage',
  warning: 'bg-deck-sand',
  danger: 'bg-deck-terracotta',
}

// Fil de la plaquette : couleur du deck, vermillon sans couleur.
export function deckThreadClass(color: DeckColor | null | undefined): string {
  return color ? DECK_COLOR_SWATCH[color] : 'bg-vermillon'
}

// Liseré en haut de la plaquette (classes de design-system/scenery.css).
export const DECK_COLOR_BAND: Record<DeckColor, string> = {
  indigo: 'ema-band ema-band-indigo',
  success: 'ema-band ema-band-success',
  warning: 'ema-band ema-band-warning',
  danger: 'ema-band ema-band-danger',
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
