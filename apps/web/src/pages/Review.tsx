import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, reviewsApi, ApiError } from '../services/api'
import type { ManualRating, ReviewSession, SubmitReviewResult } from '../types/review'
import { Card } from '../design-system/components/Card'
import { Chip } from '../design-system/components/Chip'
import { Badge } from '../design-system/components/Badge'
import { Button } from '../design-system/components/Button'
import { Flashcard } from '../design-system/components/Flashcard'
import { MilestoneBanner } from '../design-system/components/MilestoneBanner'
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
  const [extended, setExtended] = useState(false)

  const [revealed, setRevealed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [openAnswer, setOpenAnswer] = useState('')
  const [openResult, setOpenResult] = useState<SubmitReviewResult | null>(null)

  async function loadSession(deckId: string, extend = false) {
    try {
      const data = await reviewsApi.getSession(deckId, extend)
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

      setExtended(false)
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

    if (!id || !session || session.state !== 'active') return

    const isLast = currentIndex + 1 >= session.cards.length
    if (isLast) {
      await loadSession(id, extended)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  async function handleContinueToday() {
    if (!id) return
    setExtended(true)
    await loadSession(id, true)
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
      <div className="max-w-120 mx-auto">
        <div className="mb-4">
          <Notification tone="danger" title="Chargement impossible" message={loadError} />
        </div>
        <Link to="/decks">Retour aux decks</Link>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (session.state === 'capped') {
    return (
      <div className="max-w-120 mx-auto">
        <Card className="p-10">
          <MilestoneBanner message={session.message} />
          <p className="text-center mt-6 mb-0">
            <Link to={`/decks/${id}`}>Retour au deck</Link>
          </p>
        </Card>
      </div>
    )
  }

  if (session.state === 'goal_reached') {
    return (
      <div className="max-w-120 mx-auto">
        <Card className="p-10">
          <MilestoneBanner
            message={session.message}
            action={<Button variant="ghost" onClick={handleContinueToday}>Continuer aujourd'hui</Button>}
          />
          <p className="text-center mt-6 mb-0">
            <Link to={`/decks/${id}`}>Retour au deck</Link>
          </p>
        </Card>
      </div>
    )
  }

  if (session.cards.length === 0) {
    return (
      <div className="max-w-120 mx-auto">
        <Card className="p-10">
          <p className="font-body text-body-md text-ink text-center m-0 max-w-95 mx-auto">
            Tu as fait le tour des cards disponibles pour l'instant sur ce deck. Reviens plus tard pour continuer.
          </p>
          <p className="text-center mt-6 mb-0">
            <Link to={`/decks/${id}`}>Retour au deck</Link>
          </p>
        </Card>
      </div>
    )
  }

  const card = session.cards[currentIndex]
  const progressTarget = session.reviewedToday >= session.dailyGoal ? session.extendedGoal : session.dailyGoal
  const goalProgress = Math.min(100, Math.round((session.reviewedToday / Math.max(1, progressTarget)) * 100))

  return (
    <div className="max-w-140 mx-auto">
      <ToastViewport toast={toast} />

      <p className="mt-1 mb-5">
        <Link to={`/decks/${id}`}>Retour au deck</Link>
      </p>

      <div className="mb-5">
        <ProgressBar value={goalProgress} label={`Palier du jour (${session.reviewedToday} / ${progressTarget})`} />
      </div>

      <div className="flex justify-center mb-5">
        <Chip>
          Card {currentIndex + 1} / {session.cards.length}
        </Chip>
      </div>

      {card.type === 'CLASSIC' ? (
        <Flashcard
          front={card.front}
          back={card.back}
          revealed={revealed}
          onReveal={<Button onClick={() => setRevealed(true)}>Voir la réponse</Button>}
          ratingButtons={
            <>
              <Button variant="danger" disabled={submitting} onClick={() => handleClassicRating(card.id, 'AGAIN')}>
                Encore
              </Button>
              <Button variant="ghost" disabled={submitting} onClick={() => handleClassicRating(card.id, 'HARD')}>
                Difficile
              </Button>
              <Button variant="primary" disabled={submitting} onClick={() => handleClassicRating(card.id, 'GOOD')}>
                Bien
              </Button>
              <Button variant="dark" disabled={submitting} onClick={() => handleClassicRating(card.id, 'EASY')}>
                Facile
              </Button>
            </>
          }
        />
      ) : (
        <Flashcard front={card.front} revealed>
          {!openResult ? (
            <div>
              <div className="mb-4 text-left">
                <Textarea value={openAnswer} onChange={(e) => setOpenAnswer(e.target.value)} disabled={submitting} rows={4} />
              </div>
              {submitting ? (
                <div className="flex flex-col gap-2 items-center">
                  <Skeleton className="w-40 h-7" radius="pill" />
                  <span className="font-body text-body-sm text-inksoft">Évaluation en cours...</span>
                </div>
              ) : (
                <Button disabled={submitting || !openAnswer.trim()} onClick={() => handleSubmitOpenQuestion(card.id)}>
                  Valider
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <Badge tone={openResult.aiVerdict ? VERDICT_TONES[openResult.aiVerdict] : 'neutral'}>
                  {openResult.aiVerdict ? (VERDICT_LABELS[openResult.aiVerdict] ?? openResult.aiVerdict) : 'Verdict indisponible'}
                </Badge>
              </div>

              {(openResult.cePointsForts || openResult.cePointsAmeliorer) && (
                <div className="flex flex-col gap-3 text-left">
                  {openResult.cePointsForts && (
                    <div className="border border-line rounded-sm p-4">
                      <p className="font-body text-micro uppercase tracking-micro text-inkfaint m-0 mb-1.5">Points forts</p>
                      <p className="font-body text-body-sm text-ink m-0">{openResult.cePointsForts}</p>
                    </div>
                  )}
                  {openResult.cePointsAmeliorer && (
                    <div className="border border-line rounded-sm p-4">
                      <p className="font-body text-micro uppercase tracking-micro text-inkfaint m-0 mb-1.5">À améliorer</p>
                      <p className="font-body text-body-sm text-ink m-0">{openResult.cePointsAmeliorer}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-paper-sunken rounded-sm p-4 text-left">
                <p className="font-body text-micro uppercase tracking-micro text-inkfaint m-0 mb-1.5">Réponse de référence</p>
                <p className="font-body text-body-sm text-ink m-0">{card.back}</p>
              </div>

              {openResult.piste && (
                <div className="flex items-start gap-2 bg-indigo-tint text-indigo-deep rounded-sm px-3.5 py-2.5 text-left">
                  <iconify-icon icon="ph:lightbulb-bold" width="13" className="shrink-0 mt-0.5"></iconify-icon>
                  <p className="font-body text-caption m-0">
                    <span className="font-medium">Astuce.</span> {openResult.piste}
                  </p>
                </div>
              )}

              <Button className="self-start" onClick={advance}>
                Card suivante
              </Button>
            </div>
          )}
        </Flashcard>
      )}
    </div>
  )
}

export default Review
