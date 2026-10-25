import type { CardType } from '../types/card'
import type { DeckColor, DeckIcon } from '../types/deck'

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

// Fil de la plaquette (cordes, grande plaquette du deck) : couleur du deck,
// vermillon sans couleur. La nuit, version éclaircie (CON-74), la même que le
// nœud du favori, pour qu'ils restent accordés ; le vermillon suit le thème seul.
// Hors des surfaces paper et rideau, qui redéfinissent le vermillon.
const DECK_COLOR_THREAD: Record<DeckColor, string> = {
  indigo: 'bg-deck-indigo nuit:bg-deck-indigo-nuit',
  success: 'bg-deck-sage nuit:bg-deck-sage-nuit',
  warning: 'bg-deck-sand',
  danger: 'bg-deck-terracotta nuit:bg-deck-terracotta-nuit',
}

export function deckThreadClass(color: DeckColor | null | undefined): string {
  return color ? DECK_COLOR_THREAD[color] : 'bg-vermillon'
}

// Nœud du favori (CON-74) : même couleur que le fil, en couleur de texte (SVG).
const DECK_COLOR_KNOT: Record<DeckColor, string> = {
  indigo: 'text-deck-indigo nuit:text-deck-indigo-nuit',
  success: 'text-deck-sage nuit:text-deck-sage-nuit',
  warning: 'text-deck-sand',
  danger: 'text-deck-terracotta nuit:text-deck-terracotta-nuit',
}

export function deckKnotClass(color: DeckColor | null | undefined): string {
  return color ? DECK_COLOR_KNOT[color] : 'text-vermillon'
}

// Symbole du deck sur la plaquette (CON-92) : couleur de jour du deck dans les
// deux thèmes, comme le bois et l'encre de la plaquette ; vermillon de la
// surface sans couleur.
const DECK_COLOR_SYMBOL: Record<DeckColor, string> = {
  indigo: 'text-deck-indigo',
  success: 'text-deck-sage',
  warning: 'text-deck-sand',
  danger: 'text-deck-terracotta',
}

export function deckSymbolClass(color: DeckColor | null | undefined): string {
  return color ? DECK_COLOR_SYMBOL[color] : 'text-vermillon'
}

// Icônes proposées dans le rideau de deck (CON-92), dans l'ordre de la planche,
// avec leur libellé court. Valeurs en base (anciens noms Phosphor), miroir de
// la liste de l'API (decks/deck-icons.ts).
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

// Valeur en base connue ? Une valeur hors liste s'affiche comme sans icône.
export function isDeckIcon(value: string | null | undefined): value is DeckIcon {
  return (DECK_ICONS as (string | null | undefined)[]).includes(value)
}

export const DECK_ICON_LABELS: Record<DeckIcon, string> = {
  'ph:book-bold': 'Livre',
  'ph:code-bold': 'Code',
  'ph:globe-bold': 'Monde',
  'ph:music-notes-bold': 'Musique',
  'ph:lightbulb-bold': 'Idée',
  'ph:flask-bold': 'Sciences',
  'ph:calculator-bold': 'Calcul',
  'ph:palette-bold': 'Art',
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

// Onglets de la navigation principale : barre du bas sur mobile (TabBar), rail
// sur grand écran (Rail, CON-75).
export const TABS = [
  { to: '/dashboard', label: 'Accueil' },
  { to: '/decks', label: 'Decks' },
  { to: '/profile', label: 'Profil' },
]
