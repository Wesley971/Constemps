import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, decksApi, statsApi, ApiError } from '../services/api'
import type { Deck } from '../types/deck'
import type { ProgressHighlight, StatsOverview } from '../types/stats'
import { Card } from '../design-system/components/Card'
import { Chip } from '../design-system/components/Chip'
import { Badge } from '../design-system/components/Badge'
import { Notification } from '../design-system/components/Notification'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
import { LinkButton } from '../design-system/components/Button'
import type { BadgeTone } from '../design-system/components/Badge'

const RATING_LABELS: Record<number, string> = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
}

const RATING_TONES: Record<number, BadgeTone> = {
  1: 'danger',
  2: 'warning',
  3: 'success',
  4: 'success',
}

const VERDICT_LABELS: Record<string, string> = {
  compris: 'Compris',
  partiellement: 'Partiellement compris',
  incompris: 'Incompris',
}

function ProgressHighlightSection({ highlight }: { highlight: ProgressHighlight | null }) {
  if (!highlight) {
    return null
  }

  if (!highlight.available) {
    return (
      <Card className="p-6">
        <h2 className="font-display text-display-sm text-ink m-0 mb-2">Ta progression</h2>
        <p className="font-body text-body-md text-inksoft m-0">Continue à réviser pour voir apparaître ta progression ici.</p>
      </Card>
    )
  }

  const { card, oldReview, recentReview } = highlight

  return (
    <Card className="p-6">
      <h2 className="font-display text-display-sm text-ink m-0 mb-1">Ta progression</h2>
      <p className="font-body text-body-md text-ink m-0 mb-4">{card.front}</p>
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-55 border border-line rounded-sm p-4">
          <p className="font-body text-micro uppercase tracking-micro text-inkfaint m-0 mb-2.5">Il y a environ un mois</p>
          <Badge tone={RATING_TONES[oldReview.rating] ?? 'neutral'}>{RATING_LABELS[oldReview.rating] ?? oldReview.rating}</Badge>
          {oldReview.aiVerdict && (
            <p className="font-body text-body-sm text-inksoft mt-2.5 mb-0">{VERDICT_LABELS[oldReview.aiVerdict] ?? oldReview.aiVerdict}</p>
          )}
          {oldReview.userAnswer && (
            <p className="font-body text-body-sm text-inksoft mt-2 mb-0">Réponse donnée : {oldReview.userAnswer}</p>
          )}
        </div>
        <div className="flex-1 min-w-55 border border-line rounded-sm p-4">
          <p className="font-body text-micro uppercase tracking-micro text-inkfaint m-0 mb-2.5">Plus récemment</p>
          <Badge tone={RATING_TONES[recentReview.rating] ?? 'neutral'}>{RATING_LABELS[recentReview.rating] ?? recentReview.rating}</Badge>
          {recentReview.aiVerdict && (
            <p className="font-body text-body-sm text-inksoft mt-2.5 mb-0">{VERDICT_LABELS[recentReview.aiVerdict] ?? recentReview.aiVerdict}</p>
          )}
          {recentReview.userAnswer && (
            <p className="font-body text-body-sm text-inksoft mt-2 mb-0">Réponse donnée : {recentReview.userAnswer}</p>
          )}
        </div>
      </div>
      <p className="font-body text-body-sm text-inksoft mt-4 mb-0">Réponse de référence : {card.back}</p>
    </Card>
  )
}

function Stats() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [deck, setDeck] = useState<Deck | null>(null)
  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [progressHighlight, setProgressHighlight] = useState<ProgressHighlight | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function init(deckId: string) {
      try {
        await authApi.me()
      } catch {
        navigate('/login')
        return
      }

      try {
        const [deckData, overviewData, progressData] = await Promise.all([
          decksApi.get(deckId),
          statsApi.getOverview(deckId),
          statsApi.getProgressHighlight(deckId),
        ])
        setDeck(deckData)
        setOverview(overviewData)
        setProgressHighlight(progressData)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Impossible de charger les statistiques')
      } finally {
        setCheckingAuth(false)
      }
    }

    void init(id)
  }, [id, navigate])

  if (checkingAuth) {
    return <PageSkeleton />
  }

  if (error) {
    return (
      <div className="max-w-120 mx-auto">
        <div className="mb-4">
          <Notification tone="danger" title="Chargement impossible" message={error} />
        </div>
        <Link to={`/decks/${id}`}>Retour au deck</Link>
      </div>
    )
  }

  return (
    <div className="max-w-wrap mx-auto">
      <p className="mt-1 mb-5">
        <Link to={`/decks/${id}`}>Retour au deck</Link>
      </p>

      {overview && (
        <>
          <h1 className="font-body text-label text-inkfaint uppercase tracking-micro m-0 mb-2">{deck?.name}</h1>
          <p className="font-display text-display-md text-ink tracking-tight m-0 mb-8 max-w-165">{overview.message}</p>

          <div className="mb-8">
            <ProgressHighlightSection highlight={progressHighlight} />
          </div>

          <p className="font-body text-body-md text-inksoft mb-4">
            {overview.masteredCards} card{overview.masteredCards > 1 ? 's' : ''} maîtrisée{overview.masteredCards > 1 ? 's' : ''} jusqu'ici, sur{' '}
            {overview.totalCards} au total.
          </p>

          <div className="flex items-center gap-2.5 mb-8 flex-wrap">
            <Chip className="text-[11px] px-2.5 py-1 opacity-80">Streak : {overview.currentStreak} jour(s)</Chip>
            <span className="font-body text-body-sm text-inksoft">
              New {overview.cardsByState.New} · Learning {overview.cardsByState.Learning} · Review {overview.cardsByState.Review} ·
              Relearning {overview.cardsByState.Relearning}
            </span>
          </div>
        </>
      )}

      <div className="mt-4">
        <LinkButton to="/dashboard" icon="ph:squares-four-bold">
          Retrouve une vue d'ensemble de tous tes decks
        </LinkButton>
      </div>
    </div>
  )
}

export default Stats
