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

const REMAINDER_COLOR = 'rgba(23,24,28,0.16)'
const CHART_MAX_BAR_HEIGHT = 90

function formatShortDate(dateKey: string): string {
  const [, month, day] = dateKey.split('-')
  return `${day}/${month}`
}

function StatBlock({ value, caption, tone }: { value: string; caption: string; tone: 'teal' | 'ink' }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 160,
        background: tone === 'teal' ? 'var(--teal)' : 'var(--ink)',
        color: '#fff',
        borderRadius: 'var(--radius-tile)',
        boxShadow: 'var(--shadow-soft)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ font: 'var(--text-stat)', letterSpacing: 'var(--tracking-tight)' }}>{value}</div>
      <div style={{ font: 'var(--text-body-sm)', color: 'rgba(255,255,255,0.8)' }}>{caption}</div>
    </div>
  )
}

function HistoryChart({ days }: { days: HistoryDay[] }) {
  const maxCount = Math.max(1, ...days.map((d) => d.count))

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 3,
          height: CHART_MAX_BAR_HEIGHT,
          borderBottom: '1px solid var(--line)',
        }}
      >
        {days.map((day) => {
          const successHeight = (day.successCount / maxCount) * CHART_MAX_BAR_HEIGHT
          const remainderHeight = ((day.count - day.successCount) / maxCount) * CHART_MAX_BAR_HEIGHT
          return (
            <div
              key={day.date}
              title={`${day.date} : ${day.count} review(s), ${day.successCount} réussie(s)`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}
            >
              {remainderHeight > 0 && <div style={{ background: REMAINDER_COLOR, height: remainderHeight, borderRadius: '2px 2px 0 0' }} />}
              {successHeight > 0 && <div style={{ background: 'var(--success)', height: successHeight, borderRadius: '2px 2px 0 0' }} />}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--text-body-sm)', color: 'var(--inksoft)', marginTop: 8 }}>
        <span>{days.length > 0 && formatShortDate(days[0].date)}</span>
        <span>{days.length > 0 && formatShortDate(days[days.length - 1].date)}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: 'var(--text-body-sm)', color: 'var(--inksoft)' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--success)' }} />
          Réussi
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: 'var(--text-body-sm)', color: 'var(--inksoft)' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: REMAINDER_COLOR }} />
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
      <Card style={{ padding: 24 }}>
        <h2 style={{ font: 'var(--text-display-sm)', color: 'var(--ink)', margin: '0 0 8px' }}>Ta progression</h2>
        <p style={{ font: 'var(--text-body-md)', color: 'var(--inksoft)', margin: 0 }}>
          Continue à réviser pour voir apparaître ta progression ici.
        </p>
      </Card>
    )
  }

  const { card, oldReview, recentReview } = highlight

  return (
    <Card style={{ padding: 24 }}>
      <h2 style={{ font: 'var(--text-display-sm)', color: 'var(--ink)', margin: '0 0 4px' }}>Ta progression</h2>
      <p style={{ font: 'var(--text-body-md)', color: 'var(--ink)', margin: '0 0 16px' }}>{card.front}</p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
          <p style={{ font: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)', color: 'var(--inksoft)', margin: '0 0 10px' }}>
            Il y a environ un mois
          </p>
          <Badge tone={RATING_TONES[oldReview.rating] ?? 'neutral'}>{RATING_LABELS[oldReview.rating] ?? oldReview.rating}</Badge>
          {oldReview.aiVerdict && (
            <p style={{ font: 'var(--text-body-sm)', color: 'var(--inksoft)', margin: '10px 0 0' }}>
              {VERDICT_LABELS[oldReview.aiVerdict] ?? oldReview.aiVerdict}
            </p>
          )}
          {oldReview.userAnswer && (
            <p style={{ font: 'var(--text-body-sm)', color: 'var(--inksoft)', margin: '8px 0 0' }}>Réponse donnée : {oldReview.userAnswer}</p>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 220, border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
          <p style={{ font: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)', color: 'var(--inksoft)', margin: '0 0 10px' }}>
            Plus récemment
          </p>
          <Badge tone={RATING_TONES[recentReview.rating] ?? 'neutral'}>{RATING_LABELS[recentReview.rating] ?? recentReview.rating}</Badge>
          {recentReview.aiVerdict && (
            <p style={{ font: 'var(--text-body-sm)', color: 'var(--inksoft)', margin: '10px 0 0' }}>
              {VERDICT_LABELS[recentReview.aiVerdict] ?? recentReview.aiVerdict}
            </p>
          )}
          {recentReview.userAnswer && (
            <p style={{ font: 'var(--text-body-sm)', color: 'var(--inksoft)', margin: '8px 0 0' }}>Réponse donnée : {recentReview.userAnswer}</p>
          )}
        </div>
      </div>
      <p style={{ font: 'var(--text-body-sm)', color: 'var(--inksoft)', margin: '16px 0 0' }}>Réponse de référence : {card.back}</p>
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
      <div className="wrap" style={{ maxWidth: 480 }}>
        <div style={{ marginBottom: 16 }}>
          <Notification tone="danger" title="Chargement impossible" message={error} />
        </div>
        <Link to={`/decks/${id}`}>Retour au deck</Link>
      </div>
    )
  }

  return (
    <div className="wrap">
      <p style={{ margin: '4px 0 20px' }}>
        <Link to={`/decks/${id}`}>Retour au deck</Link>
      </p>
      <h1 style={{ font: 'var(--text-display-lg)', color: 'var(--ink)', letterSpacing: 'var(--tracking-tight)', margin: '0 0 20px' }}>
        Stats — {deck?.name}
      </h1>

      {overview && (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
            <StatBlock
              tone="teal"
              value={overview.retentionRate === null ? '–' : `${overview.retentionRate}%`}
              caption="Taux de rétention (30 derniers jours)"
            />
            <StatBlock tone="ink" value={String(overview.masteredCards)} caption={`Cards maîtrisées / ${overview.totalCards}`} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Chip style={{ fontSize: 11, padding: '4px 10px', opacity: 0.8 }}>Streak : {overview.currentStreak} jour(s)</Chip>
            <span style={{ font: 'var(--text-body-sm)', color: 'var(--inksoft)' }}>
              New {overview.cardsByState.New} · Learning {overview.cardsByState.Learning} · Review {overview.cardsByState.Review} ·
              Relearning {overview.cardsByState.Relearning}
            </span>
          </div>
        </>
      )}

      <Card style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ font: 'var(--text-display-sm)', color: 'var(--ink)', margin: '0 0 16px' }}>Régularité (30 derniers jours)</h2>
        <HistoryChart days={history} />
      </Card>

      <ProgressHighlightSection highlight={progressHighlight} />
    </div>
  )
}

export default Stats
