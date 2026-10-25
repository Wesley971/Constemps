import type { Card } from './card'

export type ManualRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'

export type AiVerdict = 'compris' | 'partiellement' | 'incompris'

export interface ReviewSessionActive {
  done: false
  state: 'active'
  dailyGoal: number
  extendedGoal: number
  reviewedToday: number
  cards: Card[]
  // Sans carte à servir : prochaine échéance en journées de l'app (CON-90).
  nextDueInDays: number | null
}

export interface ReviewSessionGoalReached {
  done: false
  state: 'goal_reached'
  // Cartes encore dues (CON-87) : sans elles, pas de « Continuer aujourd'hui ».
  canContinue: boolean
  // Prochaine échéance en journées de l'app (CON-90), pour le voile.
  nextDueInDays: number | null
  message: string
  dailyGoal: number
  extendedGoal: number
  reviewedToday: number
}

export interface ReviewSessionCapped {
  done: true
  state: 'capped'
  message: string
  dailyGoal: number
  extendedGoal: number
  reviewedToday: number
}

export type ReviewSession = ReviewSessionActive | ReviewSessionGoalReached | ReviewSessionCapped

export interface SubmitReviewResult {
  card: Card
  aiVerdict: AiVerdict | null
  cePointsForts: string | null
  cePointsAmeliorer: string | null
  piste: string | null
}
