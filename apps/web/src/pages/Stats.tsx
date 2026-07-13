import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, decksApi, statsApi, ApiError } from '../services/api'
import type { Deck } from '../types/deck'
import type { HistoryDay, ProgressHighlight, StatsOverview } from '../types/stats'

const RATING_LABELS: Record<number, string> = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
}

const VERDICT_LABELS: Record<string, string> = {
  compris: 'Compris',
  partiellement: 'Partiellement compris',
  incompris: 'Incompris',
}

const SUCCESS_COLOR = '#0ca30c'
const REMAINDER_COLOR = '#898781'
const CHART_MAX_BAR_HEIGHT = 80

function formatShortDate(dateKey: string): string {
  const [, month, day] = dateKey.split('-')
  return `${day}/${month}`
}

function HistoryChart({ days }: { days: HistoryDay[] }) {
  const maxCount = Math.max(1, ...days.map((d) => d.count))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: CHART_MAX_BAR_HEIGHT, borderBottom: '1px solid #c3c2b7' }}>
        {days.map((day) => {
          const successHeight = (day.successCount / maxCount) * CHART_MAX_BAR_HEIGHT
          const remainderHeight = ((day.count - day.successCount) / maxCount) * CHART_MAX_BAR_HEIGHT
          return (
            <div
              key={day.date}
              title={`${day.date} : ${day.count} review(s), ${day.successCount} réussie(s)`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}
            >
              {remainderHeight > 0 && <div style={{ backgroundColor: REMAINDER_COLOR, height: remainderHeight }} />}
              {successHeight > 0 && <div style={{ backgroundColor: SUCCESS_COLOR, height: successHeight }} />}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#898781' }}>
        <span>{days.length > 0 && formatShortDate(days[0].date)}</span>
        <span>{days.length > 0 && formatShortDate(days[days.length - 1].date)}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, marginTop: 4 }}>
        <span>
          <span style={{ display: 'inline-block', width: 10, height: 10, backgroundColor: SUCCESS_COLOR, marginRight: 4 }} />
          Réussi
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 10, height: 10, backgroundColor: REMAINDER_COLOR, marginRight: 4 }} />
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
      <div>
        <h2>Ta progression</h2>
        <p>Continue à réviser pour voir apparaître ta progression ici.</p>
      </div>
    )
  }

  const { card, oldReview, recentReview } = highlight

  return (
    <div>
      <h2>Ta progression</h2>
      <p>{card.front}</p>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, border: '1px solid #e1e0d9', padding: 8 }}>
          <p>
            <strong>Il y a environ un mois</strong>
          </p>
          <p>{RATING_LABELS[oldReview.rating] ?? oldReview.rating}</p>
          {oldReview.aiVerdict && <p>{VERDICT_LABELS[oldReview.aiVerdict] ?? oldReview.aiVerdict}</p>}
          {oldReview.userAnswer && <p>Réponse donnée : {oldReview.userAnswer}</p>}
        </div>
        <div style={{ flex: 1, border: '1px solid #e1e0d9', padding: 8 }}>
          <p>
            <strong>Plus récemment</strong>
          </p>
          <p>{RATING_LABELS[recentReview.rating] ?? recentReview.rating}</p>
          {recentReview.aiVerdict && <p>{VERDICT_LABELS[recentReview.aiVerdict] ?? recentReview.aiVerdict}</p>}
          {recentReview.userAnswer && <p>Réponse donnée : {recentReview.userAnswer}</p>}
        </div>
      </div>
      <p>Réponse de référence : {card.back}</p>
    </div>
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
    return <p>Chargement...</p>
  }

  if (error) {
    return (
      <div>
        <p role="alert">{error}</p>
        <Link to={`/decks/${id}`}>Retour au deck</Link>
      </div>
    )
  }

  return (
    <div>
      <p>
        <Link to={`/decks/${id}`}>Retour au deck</Link>
      </p>
      <h1>Stats - {deck?.name}</h1>

      {overview && (
        <>
          <div style={{ display: 'flex', gap: 32, alignItems: 'baseline', margin: '16px 0' }}>
            <div>
              <div style={{ fontSize: 48, fontWeight: 'bold' }}>
                {overview.retentionRate === null ? '-' : `${overview.retentionRate}%`}
              </div>
              <div>Taux de rétention (30 derniers jours)</div>
            </div>
            <div>
              <div style={{ fontSize: 48, fontWeight: 'bold' }}>{overview.masteredCards}</div>
              <div>Cards maîtrisées / {overview.totalCards}</div>
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#898781' }}>Streak actuel : {overview.currentStreak} jour(s)</p>

          <p style={{ fontSize: 13 }}>
            New : {overview.cardsByState.New} / Learning : {overview.cardsByState.Learning} / Review :{' '}
            {overview.cardsByState.Review} / Relearning : {overview.cardsByState.Relearning}
          </p>
        </>
      )}

      <h2>Régularité (30 derniers jours)</h2>
      <HistoryChart days={history} />

      <ProgressHighlightSection highlight={progressHighlight} />
    </div>
  )
}

export default Stats
