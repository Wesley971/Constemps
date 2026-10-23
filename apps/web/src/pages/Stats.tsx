import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { authApi, decksApi, statsApi, ApiError } from '../services/api'
import type { Deck } from '../types/deck'
import type { ProgressHighlight, ProgressHighlightReview, StatsOverview } from '../types/stats'
import { AppScreen } from '../design-system/components/AppScreen'
import { BackLink } from '../design-system/components/BackLink'
import { BrushStroke } from '../design-system/components/BrushStroke'
import { InkRule } from '../design-system/components/InkRule'
import { Label } from '../design-system/components/Label'
import { Notification } from '../design-system/components/Notification'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
import { Scroll } from '../design-system/components/Scroll'
import { RATING_LABELS, VERDICT_LABELS } from '../design-system/constants'
import { plural } from '../lib/today'
import { frenchSpacing } from '../lib/typography'

// Couleur du verdict, sur le papier des volets (contrastes AA en petit texte).
const RATING_TEXT: Record<number, string> = {
  1: 'text-danger',
  2: 'text-warning-ink',
  3: 'text-success-deep',
  4: 'text-success-deep',
}

const VERDICT_TEXT: Record<string, string> = {
  compris: 'text-success-deep',
  partiellement: 'text-warning-ink',
  incompris: 'text-danger',
}

// Verdict de l'IA pour une carte Avis assisté, sinon la notation de la révision.
function reviewVerdict(review: ProgressHighlightReview): { label: string; color: string } {
  if (review.aiVerdict) {
    return { label: VERDICT_LABELS[review.aiVerdict] ?? review.aiVerdict, color: VERDICT_TEXT[review.aiVerdict] ?? 'text-ink' }
  }
  return { label: RATING_LABELS[review.rating] ?? String(review.rating), color: RATING_TEXT[review.rating] ?? 'text-ink' }
}

function ReviewPanel({ when, review }: { when: string; review: ProgressHighlightReview }) {
  const verdict = reviewVerdict(review)
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-2 p-3 pb-4 rounded-t-xs rounded-b-md bg-paper-sunken">
      <span className="text-caption text-inksoft">{when}</span>
      <span className={`self-start inline-flex flex-col font-display text-body-md font-bold ${verdict.color}`}>
        {verdict.label}
        <BrushStroke tone="current" className="w-full h-1" delayMs={1200} />
      </span>
      {review.userAnswer ? <span className="text-caption text-inksoft break-words">Réponse donnée : {review.userAnswer}</span> : null}
    </div>
  )
}

function ProgressSection({ highlight }: { highlight: ProgressHighlight }) {
  return (
    <section aria-labelledby="ta-progression" className="flex flex-col gap-2">
      <Label id="ta-progression">Ta progression</Label>
      {highlight.available ? (
        <>
          <span className="font-display text-display-md break-words">{frenchSpacing(highlight.card.front)}</span>
          <div className="flex gap-2">
            <ReviewPanel when="Il y a environ un mois" review={highlight.oldReview} />
            <ReviewPanel when="Plus récemment" review={highlight.recentReview} />
          </div>
          <span className="text-body-sm text-inksoft break-words">Réponse de référence : {frenchSpacing(highlight.card.back)}</span>
        </>
      ) : (
        <p className="m-0 text-body-sm text-inksoft">Continue à réviser pour voir apparaître ta progression ici.</p>
      )}
    </section>
  )
}

// Stats d'un deck (CON-69, S15-stats) : message de l'IA dans le rouleau,
// progression d'une carte, cartes maîtrisées, états des cartes, puis la série,
// volontairement discrète (secondaire, jamais dominante).
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

  return (
    <AppScreen>
      <BackLink to={`/decks/${id}`}>{deck?.name ?? 'Retour au deck'}</BackLink>

      {error ? <Notification tone="danger" title="Chargement impossible" message={error} /> : null}

      {overview ? (
        <>
          <h1 className="sr-only">Stats du deck {deck?.name}</h1>
          <Scroll label="Ce deck">
            <p className="m-0 font-display text-scroll text-balance">{frenchSpacing(overview.message)}</p>
          </Scroll>

          {progressHighlight ? <ProgressSection highlight={progressHighlight} /> : null}

          <InkRule />

          <div className="flex items-baseline gap-3">
            <span className="font-display text-display-xl text-indigo">{overview.masteredCards}</span>
            <span className="text-body-sm">
              {plural(overview.masteredCards, 'carte maîtrisée', 'cartes maîtrisées')}
              <br />
              <span className="text-inksoft">sur {overview.totalCards} au total</span>
            </span>
          </div>

          <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-1 text-label font-normal text-inksoft">
            {[
              ['Nouvelles', overview.cardsByState.New],
              ['En apprentissage', overview.cardsByState.Learning],
              ['En révision', overview.cardsByState.Review],
              ['À reprendre', overview.cardsByState.Relearning],
            ].map(([label, count]) => (
              <div key={label} className="flex gap-1">
                <dt>{label}</dt>
                <dd className="m-0">· {count}</dd>
              </div>
            ))}
          </dl>

          {/* Série affichée seulement quand elle existe : rien qui ressemble à un compteur cassé. */}
          {overview.currentStreak > 0 ? (
            <p className="m-0 text-caption text-inksoft">
              Série en cours : {overview.currentStreak} {plural(overview.currentStreak, 'jour', 'jours')}
            </p>
          ) : null}
        </>
      ) : null}
    </AppScreen>
  )
}

export default Stats
