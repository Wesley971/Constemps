import type { Deck } from '../types/deck'

// Calculs de l'accueil (CON-68). Le palier reste par deck (CLAUDE.md) : la
// lanterne n'est qu'une somme d'affichage, aucun blocage global.

export type DeckTodayStatus = 'todo' | 'goal-reached' | 'clear'

export interface DeckToday {
  deck: Deck
  // Objectif du jour : le palier déjà ramené par l'API aux cartes réellement
  // disponibles (faites + dues), le même que l'écran de révision (CON-87).
  target: number
  // Faites, plafonnées à l'objectif : l'extension ne fait pas déborder le cercle.
  done: number
  remaining: number
  status: DeckTodayStatus
  // Progression du cercle de la plaquette, de 0 à 100.
  progress: number
}

export function deckToday(deck: Deck): DeckToday {
  const target = deck.dailyGoal ?? 0
  const done = Math.min(deck.reviewedToday ?? 0, target)
  const remaining = target - done
  // Palier atteint dès qu'une carte a été faite et l'objectif rempli, même sans
  // carte due restante : comme le voile « Journée close » de la révision.
  const status: DeckTodayStatus = remaining > 0 ? 'todo' : deck.dailyGoalReached ? 'goal-reached' : 'clear'
  const progress = target === 0 ? 100 : (done / target) * 100

  return { deck, target, done, remaining, status, progress }
}

// Libellé de la plaquette : la somme des « à revoir » égale toujours le chiffre
// de la lanterne (décision de Wesley, esprit anti-cram).
export function deckTodayLabel({ status, remaining }: DeckToday): string {
  if (status === 'todo') return `${remaining} à revoir`
  if (status === 'goal-reached') return 'Palier atteint'
  return 'À jour'
}

export type DayState = 'empty' | 'active' | 'closed' | 'clear'

export interface DaySummary {
  decks: DeckToday[]
  done: number
  target: number
  remaining: number
  state: DayState
  // Premier deck, dans l'ordre affiché, qui a encore des cartes sous son palier.
  resumeDeck: Deck | null
  // Premier deck où la révision a encore quelque chose à servir (canContinue de
  // l'API : cartes dues, palier étendu pas atteint), pour débloquer l'extension.
  continueDeck: Deck | null
}

export function summarizeDay(decks: Deck[]): DaySummary {
  const perDeck = decks.map(deckToday)
  const done = perDeck.reduce((sum, d) => sum + d.done, 0)
  const target = perDeck.reduce((sum, d) => sum + d.target, 0)
  const remaining = target - done
  const reviewedToday = decks.reduce((sum, d) => sum + (d.reviewedToday ?? 0), 0)

  let state: DayState
  if (decks.length === 0) state = 'empty'
  else if (remaining > 0) state = 'active'
  else if (reviewedToday > 0) state = 'closed'
  else state = 'clear'

  return {
    decks: perDeck,
    done,
    target,
    remaining,
    state,
    resumeDeck: perDeck.find((d) => d.remaining > 0)?.deck ?? null,
    continueDeck: decks.find((d) => d.canContinue) ?? null,
  }
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Printemps',
  summer: 'Été',
  autumn: 'Automne',
  winter: 'Hiver',
}

// Dates fixes (décision de Wesley) : printemps le 20 mars, été le 21 juin,
// automne le 22 septembre, hiver le 21 décembre.
export function seasonOf(date: Date): Season {
  const md = (date.getMonth() + 1) * 100 + date.getDate()
  if (md >= 1221 || md < 320) return 'winter'
  if (md < 621) return 'spring'
  if (md < 922) return 'summer'
  return 'autumn'
}

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })

// Ex. « vendredi 23 oct. »
export function formatToday(date: Date): string {
  return DATE_FORMAT.format(date)
}

export function plural(n: number, singular: string, pluralForm: string): string {
  return n > 1 ? pluralForm : singular
}

// Résumé de Mes decks (S14-decks) : le nombre « à revoir » est celui de la
// lanterne de l'accueil.
export function decksSummaryLabel(day: DaySummary): string {
  if (day.state === 'empty') return 'Aucun deck pour l’instant'
  const count = `${day.decks.length} ${plural(day.decks.length, 'deck', 'decks')}`
  if (day.state === 'active') return `${count}, ${day.remaining} ${plural(day.remaining, 'carte', 'cartes')} à revoir`
  if (day.state === 'closed') return `${count}, palier du jour atteint`
  return `${count}, tout est à jour`
}

// Ligne secondaire de l'intérieur d'un deck : cartes dues au total, au-delà
// du palier du jour, puis nombre de cartes (« 11 en attente · 48 cartes »).
export function deckCountsLabel(deck: Deck): string {
  const total = deck.cardCount ?? 0
  if (total === 0) return 'Aucune carte'
  const cards = `${total} ${plural(total, 'carte', 'cartes')}`
  const due = deck.dueCardsCount ?? 0
  return due > 0 ? `${due} en attente · ${cards}` : cards
}
