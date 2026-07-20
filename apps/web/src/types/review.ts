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
}

export interface ReviewSessionGoalReached {
  done: false
  state: 'goal_reached'
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
}
