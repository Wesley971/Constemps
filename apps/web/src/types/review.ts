import type { Card } from './card'

export type ManualRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'

export type AiVerdict = 'compris' | 'partiellement' | 'incompris'

export interface ReviewSessionDone {
  done: true
  message: string
  dailyGoal: number
  reviewedToday: number
}

export interface ReviewSessionActive {
  done: false
  dailyGoal: number
  reviewedToday: number
  cards: Card[]
}

export type ReviewSession = ReviewSessionDone | ReviewSessionActive

export interface SubmitReviewResult {
  card: Card
  aiVerdict: AiVerdict | null
}
