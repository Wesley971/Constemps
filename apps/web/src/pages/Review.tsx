import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, reviewsApi, ApiError } from '../services/api'
import type { ManualRating, ReviewSession, SubmitReviewResult } from '../types/review'

const VERDICT_LABELS: Record<string, string> = {
  compris: 'Compris',
  partiellement: 'Partiellement compris',
  incompris: 'Incompris',
}

function Review() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [session, setSession] = useState<ReviewSession | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

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
      setError(err instanceof ApiError ? err.message : 'Impossible de charger la session de révision')
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
    setError(null)
    try {
      await reviewsApi.submitClassic(cardId, rating)
      await advance()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer la réponse")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitOpenQuestion(cardId: string) {
    if (!openAnswer.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      const result = await reviewsApi.submitOpenQuestion(cardId, openAnswer.trim())
      setOpenResult(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'évaluer la réponse")
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingAuth) {
    return <p>Chargement...</p>
  }

  if (error && !session) {
    return (
      <div>
        <p role="alert">{error}</p>
        <Link to="/decks">Retour aux decks</Link>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (session.done) {
    return (
      <div>
        <p>{session.message}</p>
        <Link to="/decks">Retour aux decks</Link>
      </div>
    )
  }

  if (session.cards.length === 0) {
    return (
      <div>
        <p>Pas de card à réviser pour l'instant sur ce deck.</p>
        <Link to="/decks">Retour aux decks</Link>
      </div>
    )
  }

  const card = session.cards[currentIndex]

  return (
    <div>
      <p>
        <Link to={`/decks/${id}`}>Retour au deck</Link>
      </p>
      <p>
        Card {currentIndex + 1} / {session.cards.length}
      </p>

      {error && <p role="alert">{error}</p>}

      {card.type === 'CLASSIC' ? (
        <div>
          <h2>{card.front}</h2>
          {!revealed ? (
            <button type="button" onClick={() => setRevealed(true)}>
              Voir la réponse
            </button>
          ) : (
            <div>
              <p>{card.back}</p>
              <button type="button" disabled={submitting} onClick={() => handleClassicRating(card.id, 'AGAIN')}>
                Again
              </button>
              <button type="button" disabled={submitting} onClick={() => handleClassicRating(card.id, 'HARD')}>
                Hard
              </button>
              <button type="button" disabled={submitting} onClick={() => handleClassicRating(card.id, 'GOOD')}>
                Good
              </button>
              <button type="button" disabled={submitting} onClick={() => handleClassicRating(card.id, 'EASY')}>
                Easy
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2>{card.front}</h2>
          {!openResult ? (
            <div>
              <textarea
                value={openAnswer}
                onChange={(e) => setOpenAnswer(e.target.value)}
                disabled={submitting}
                rows={4}
              />
              <div>
                <button type="button" disabled={submitting} onClick={() => handleSubmitOpenQuestion(card.id)}>
                  {submitting ? 'Évaluation en cours...' : 'Valider'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p>Verdict : {VERDICT_LABELS[openResult.aiVerdict ?? ''] ?? openResult.aiVerdict}</p>
              <p>Réponse de référence : {card.back}</p>
              <button type="button" onClick={advance}>
                Card suivante
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Review
