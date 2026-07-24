import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, decksApi, statsApi, ApiError } from '../services/api'
import type { Deck } from '../types/deck'
import type { HistoryDay, ProgressHighlight, StatsOverview } from '../types/stats'
import { Card } from '../design-system/components/Card'
import { Chip } from '../design-system/components/Chip'
import { Badge } from '../design-system/components/Badge'
import { Notification } from '../design-system/components/Notification'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
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

const CHART_MAX_BAR_HEIGHT = 90

function formatShortDate(dateKey: string): string {
  const [, month, day] = dateKey.split('-')
  return `${day}/${month}`
}

function StatBlock({ value, caption, tone }: { value: string; caption: string; tone: 'teal' | 'ink' }) {
  return (
    <div
      className={`flex-1 min-w-40 ${tone === 'teal' ? 'bg-teal' : 'bg-ink'} text-white rounded-tile shadow-soft p-5 flex flex-col gap-1.5`}
    >
      <div className="font-display text-stat tracking-tight">{value}</div>
      <div className="font-body text-body-sm text-white/80">{caption}</div>
    </div>
  )
}

function HistoryChart({ days }: { days: HistoryDay[] }) {
  const maxCount = Math.max(1, ...days.map((d) => d.count))

  return (
    <div>
      <div className="flex items-end gap-[3px] h-[90px] border-b border-line">
        {days.map((day) => {
          const successHeight = (day.successCount / maxCount) * CHART_MAX_BAR_HEIGHT
          const remainderHeight = ((day.count - day.successCount) / maxCount) * CHART_MAX_BAR_HEIGHT
          return (
            <div
              key={day.date}
              title={`${day.date} : ${day.count} review(s), ${day.successCount} réussie(s)`}
              className="flex-1 flex flex-col justify-end h-full"
            >
              {/* hauteur pilotée par une valeur continue calculée depuis les données réelles :
                  ne peut pas être exprimée en classe Tailwind statique */}
              {remainderHeight > 0 && <div style={{ height: remainderHeight }} className="bg-ink/16 rounded-t-[2px]" />}
              {successHeight > 0 && <div style={{ height: successHeight }} className="bg-success rounded-t-[2px]" />}
            </div>
          )
        })}
      </div>
      <div className="flex justify-between font-body text-body-sm text-inksoft mt-2">
        <span>{days.length > 0 && formatShortDate(days[0].date)}</span>
        <span>{days.length > 0 && formatShortDate(days[days.length - 1].date)}</span>
      </div>
      <div className="flex gap-4 mt-3">
        <span className="inline-flex items-center gap-1.5 font-body text-body-sm text-inksoft">
          <span className="inline-block w-2.5 h-2.5 rounded-[3px] bg-success" />
          Réussi
        </span>
        <span className="inline-flex items-center gap-1.5 font-body text-body-sm text-inksoft">
          <span className="inline-block w-2.5 h-2.5 rounded-[3px] bg-ink/16" />
          À retravailler
        </span>
      </div>
    </div>
  )
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
          <p className="font-body text-micro uppercase text-inksoft m-0 mb-2.5">Il y a environ un mois</p>
          <Badge tone={RATING_TONES[oldReview.rating] ?? 'neutral'}>{RATING_LABELS[oldReview.rating] ?? oldReview.rating}</Badge>
          {oldReview.aiVerdict && (
            <p className="font-body text-body-sm text-inksoft mt-2.5 mb-0">{VERDICT_LABELS[oldReview.aiVerdict] ?? oldReview.aiVerdict}</p>
          )}
          {oldReview.userAnswer && (
            <p className="font-body text-body-sm text-inksoft mt-2 mb-0">Réponse donnée : {oldReview.userAnswer}</p>
          )}
        </div>
        <div className="flex-1 min-w-55 border border-line rounded-sm p-4">
          <p className="font-body text-micro uppercase text-inksoft m-0 mb-2.5">Plus récemment</p>
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
  const [history, setHistory] = useState<HistoryDay[]>([])
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
        const [deckData, overviewData, historyData, progressData] = await Promise.all([
          decksApi.get(deckId),
          statsApi.getOverview(deckId),
          statsApi.getHistory(deckId),
          statsApi.getProgressHighlight(deckId),
        ])
        setDeck(deckData)
        setOverview(overviewData)
        setHistory(historyData)
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
      <h1 className="font-display text-display-lg text-ink tracking-tight m-0 mb-5">Stats — {deck?.name}</h1>

      {overview && (
        <>
          <div className="flex gap-4 mb-3 flex-wrap">
            <StatBlock
              tone="teal"
              value={overview.retentionRate === null ? '–' : `${overview.retentionRate}%`}
              caption="Taux de rétention (30 derniers jours)"
            />
            <StatBlock tone="ink" value={String(overview.masteredCards)} caption={`Cards maîtrisées / ${overview.totalCards}`} />
          </div>

          <div className="flex items-center gap-2.5 mb-6">
            <Chip className="text-[11px] px-2.5 py-1 opacity-80">Streak : {overview.currentStreak} jour(s)</Chip>
            <span className="font-body text-body-sm text-inksoft">
              New {overview.cardsByState.New} · Learning {overview.cardsByState.Learning} · Review {overview.cardsByState.Review} ·
              Relearning {overview.cardsByState.Relearning}
            </span>
          </div>
        </>
      )}

      <Card className="p-6 mb-6">
        <h2 className="font-display text-display-sm text-ink m-0 mb-4">Régularité (30 derniers jours)</h2>
        <HistoryChart days={history} />
      </Card>

      <ProgressHighlightSection highlight={progressHighlight} />
    </div>
  )
}

export default Stats
