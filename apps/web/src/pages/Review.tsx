import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, reviewsApi, ApiError } from '../services/api'
import type { ManualRating, ReviewSession, SubmitReviewResult } from '../types/review'
import { Card } from '../design-system/components/Card'
import { Chip } from '../design-system/components/Chip'
import { Badge } from '../design-system/components/Badge'
import { Button } from '../design-system/components/Button'
import { Textarea } from '../design-system/components/Textarea'
import { Notification } from '../design-system/components/Notification'
import { ToastViewport } from '../design-system/components/ToastViewport'
import { ProgressBar } from '../design-system/components/ProgressBar'
import { Skeleton } from '../design-system/components/Skeleton'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
import { useToast } from '../design-system/useToast'
import type { BadgeTone } from '../design-system/components/Badge'

const VERDICT_LABELS: Record<string, string> = {
  compris: 'Compris',
  partiellement: 'Partiellement compris',
  incompris: 'Incompris',
}

const VERDICT_TONES: Record<string, BadgeTone> = {
  compris: 'success',
  partiellement: 'warning',
  incompris: 'danger',
}

function Review() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast, notify } = useToast()

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [session, setSession] = useState<ReviewSession | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [revealed, setRevealed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [openAnswer, setOpenAnswer] = useState('')
  const [openResult, setOpenResult] = useState<SubmitReviewResult | null>(null)

  async function loadSession(deckId: string) {
    try {
      const data = await reviewsApi.getSession(deckId)
      setSession(data)
      setCurrentIndex(0)
      setRevealed(false)
      setOpenAnswer('')
      setOpenResult(null)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Impossible de charger la session de révision')
    }
  }

  useEffect(() => {
    if (!id) return

    async function init(deckId: string) {
      try {
        await authApi.me()
      } catch {
        navigate('/login')
        return
      }

      await loadSession(deckId)
      setCheckingAuth(false)
    }

    void init(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate])

  async function advance() {
    setRevealed(false)
    setOpenAnswer('')
    setOpenResult(null)

    if (!id || !session || session.done) return

    const isLast = currentIndex + 1 >= session.cards.length
    if (isLast) {
      await loadSession(id)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  async function handleClassicRating(cardId: string, rating: ManualRating) {
    setSubmitting(true)
    try {
      await reviewsApi.submitClassic(cardId, rating)
      await advance()
    } catch (err) {
      notify({ tone: 'danger', title: 'Enregistrement impossible', message: err instanceof ApiError ? err.message : "Impossible d'enregistrer la réponse" })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitOpenQuestion(cardId: string) {
    if (!openAnswer.trim()) return

    setSubmitting(true)
    try {
      const result = await reviewsApi.submitOpenQuestion(cardId, openAnswer.trim())
      setOpenResult(result)
    } catch (err) {
      notify({ tone: 'danger', title: 'Évaluation impossible', message: err instanceof ApiError ? err.message : "Impossible d'évaluer la réponse" })
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingAuth) {
    return <PageSkeleton />
  }

  if (loadError && !session) {
    return (
      <div className="wrap" style={{ maxWidth: 480 }}>
        <div style={{ marginBottom: 16 }}>
          <Notification tone="danger" title="Chargement impossible" message={loadError} />
        </div>
        <Link to="/decks">Retour aux decks</Link>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (session.done) {
    return (
      <div className="wrap" style={{ maxWidth: 480 }}>
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ marginBottom: 20 }}>
            <ProgressBar value={100} label="Palier du jour" tone="success" />
          </div>
          <p style={{ font: 'var(--text-body-md)', color: 'var(--ink)', margin: '0 0 16px' }}>{session.message}</p>
          <Link to="/decks">Retour aux decks</Link>
        </Card>
      </div>
    )
  }

  if (session.cards.length === 0) {
    return (
      <div className="wrap" style={{ maxWidth: 480 }}>
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ font: 'var(--text-body-md)', color: 'var(--ink)', margin: '0 0 16px' }}>
            Pas de card à réviser pour l'instant sur ce deck.
          </p>
          <Link to="/decks">Retour aux decks</Link>
        </Card>
      </div>
    )
  }

  const card = session.cards[currentIndex]
  const goalProgress = Math.min(100, Math.round((session.reviewedToday / Math.max(1, session.dailyGoal)) * 100))

  return (
    <div className="wrap" style={{ maxWidth: 560 }}>
      <ToastViewport toast={toast} />

      <p style={{ margin: '4px 0 20px' }}>
        <Link to={`/decks/${id}`}>Retour au deck</Link>
      </p>

      <div style={{ marginBottom: 20 }}>
        <ProgressBar value={goalProgress} label={`Palier du jour (${session.reviewedToday} / ${session.dailyGoal})`} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <Chip>
          Card {currentIndex + 1} / {session.cards.length}
        </Chip>
      </div>

      <Card style={{ padding: 32 }}>
        {card.type === 'CLASSIC' ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ font: 'var(--text-display-md)', color: 'var(--ink)', letterSpacing: 'var(--tracking-tight)', margin: '0 0 20px' }}>
              {card.front}
            </h2>
            {!revealed ? (
              <Button onClick={() => setRevealed(true)}>Voir la réponse</Button>
            ) : (
              <div>
                <p style={{ font: 'var(--text-body-md)', color: 'var(--inksoft)', margin: '0 0 24px' }}>{card.back}</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button variant="danger" disabled={submitting} onClick={() => handleClassicRating(card.id, 'AGAIN')}>
                    Again
                  </Button>
                  <Button variant="ghost" disabled={submitting} onClick={() => handleClassicRating(card.id, 'HARD')}>
                    Hard
                  </Button>
                  <Button variant="primary" disabled={submitting} onClick={() => handleClassicRating(card.id, 'GOOD')}>
                    Good
                  </Button>
                  <Button variant="dark" disabled={submitting} onClick={() => handleClassicRating(card.id, 'EASY')}>
                    Easy
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ font: 'var(--text-display-md)', color: 'var(--ink)', letterSpacing: 'var(--tracking-tight)', margin: '0 0 20px' }}>
              {card.front}
            </h2>
            {!openResult ? (
              <div>
                <div style={{ marginBottom: 16, textAlign: 'left' }}>
                  <Textarea value={openAnswer} onChange={(e) => setOpenAnswer(e.target.value)} disabled={submitting} rows={4} />
                </div>
                {submitting ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                    <Skeleton width={160} height={28} radius="var(--radius-pill)" />
                    <span style={{ font: 'var(--text-body-sm)', color: 'var(--inksoft)' }}>Évaluation en cours...</span>
                  </div>
                ) : (
                  <Button disabled={submitting} onClick={() => handleSubmitOpenQuestion(card.id)}>
                    Valider
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 16px' }}>
                  <Badge tone={openResult.aiVerdict ? VERDICT_TONES[openResult.aiVerdict] : 'neutral'}>
                    {openResult.aiVerdict ? (VERDICT_LABELS[openResult.aiVerdict] ?? openResult.aiVerdict) : 'Verdict indisponible'}
                  </Badge>
                </div>
                <p style={{ font: 'var(--text-body-md)', color: 'var(--inksoft)', margin: '0 0 24px' }}>
                  Réponse de référence : {card.back}
                </p>
                <Button onClick={advance}>Card suivante</Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default Review
