export interface CardsByState {
  New: number
  Learning: number
  Review: number
  Relearning: number
}

export interface StatsOverview {
  totalCards: number
  cardsByState: CardsByState
  retentionRate: number | null
  masteredCards: number
  currentStreak: number
}

export interface HistoryDay {
  date: string
  count: number
  successCount: number
}

export interface ProgressHighlightReview {
  rating: number
  userAnswer: string | null
  aiVerdict: string | null
  reviewedAt: string
}

export interface ProgressHighlightCard {
  id: string
  type: 'CLASSIC' | 'OPEN_QUESTION'
  front: string
  back: string
}

export interface ProgressHighlightAvailable {
  available: true
  card: ProgressHighlightCard
  oldReview: ProgressHighlightReview
  recentReview: ProgressHighlightReview
}

export interface ProgressHighlightUnavailable {
  available: false
}

export type ProgressHighlight = ProgressHighlightAvailable | ProgressHighlightUnavailable
