import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, decksApi, reviewsApi, ApiError } from '../services/api'
import type { Card } from '../types/card'
import type { ManualRating, ReviewSession, SubmitReviewResult } from '../types/review'
import { AppScreen } from '../design-system/components/AppScreen'
import { BrushCircle } from '../design-system/components/BrushCircle'
import { BrushLink } from '../design-system/components/BrushLink'
import { Button } from '../design-system/components/Button'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
import { RoundCard } from '../design-system/components/RoundCard'
import { Textarea } from '../design-system/components/Textarea'
import { ToastViewport } from '../design-system/components/ToastViewport'
import { VerdictStamp } from '../design-system/components/VerdictStamp'
import { useToast } from '../design-system/useToast'
import { CARD_TYPE_LABELS } from '../design-system/constants'
import { frontSizeClass, RATINGS } from '../lib/review'
import { plural } from '../lib/today'
import { frenchSpacing } from '../lib/typography'
import { AiFeedback, ClosedVeil, RatingButtons } from './ReviewParts'

// Texte du voile à la fin du palier (V7-revision). Le palier étendu atteint
// garde le message de l'API.
const DAY_CLOSED_MESSAGE = 'Le cercle est fermé. Tu peux t’arrêter là, la suite t’attendra demain.'

function TypeTag({ type }: { type: Card['type'] }) {
  if (type === 'OPEN_QUESTION') {
    return (
      <span className="inline-flex items-center gap-1 text-micro uppercase tracking-micro text-vermillon">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3" fill="currentColor">
          <path d="M12 3c.8 4.6 2.6 7 7.5 9-4.9 2-6.7 4.4-7.5 9-.8-4.6-2.6-7-7.5-9 4.9-2 6.7-4.4 7.5-9z" />
        </svg>
        {CARD_TYPE_LABELS[type]}
      </span>
    )
  }
  return <span className="px-3 py-1 rounded-pill bg-indigo-tint text-indigo text-caption font-bold">{CARD_TYPE_LABELS[type]}</span>
}

// Un champ de saisie a le clavier : les raccourcis ne doivent rien y voler.
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

// Révision refondue (CON-72, V7-revision et S15-retour-ia) : plein écran sans
// onglets, carte ronde, palier au pinceau dans le rideau, retour de l'IA dans le
// rouleau, voile « Journée close » à la fin du palier.
function Review() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast, notify } = useToast()

  const [loading, setLoading] = useState(true)
  const [deckName, setDeckName] = useState('')
  const [cardCount, setCardCount] = useState<number | null>(null)
  const [session, setSession] = useState<ReviewSession | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  // Cartes faites aujourd'hui : recalé sur l'API à chaque chargement de session,
  // avancé seulement après un envoi réussi.
  const [doneToday, setDoneToday] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [extended, setExtended] = useState(false)
  const [continuing, setContinuing] = useState(false)

  const [revealed, setRevealed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Garde synchrone : deux touches ou deux clics avant le rendu suivant ne doivent
  // jamais envoyer deux révisions (l'état submitting n'est lu qu'au rendu).
  const submittingRef = useRef(false)
  const [inked, setInked] = useState<{ rating: ManualRating; at: number } | null>(null)

  const [openAnswer, setOpenAnswer] = useState('')
  const [openResult, setOpenResult] = useState<SubmitReviewResult | null>(null)

  const revealRef = useRef<HTMLButtonElement>(null)
  // Vrai après une notation : seul ce cas ramène le focus sur « Voir le verso »
  // (à l'ouverture, l'anneau de focus apparaîtrait sans raison).
  const ratedRef = useRef(false)
  const versoRef = useRef<HTMLDivElement>(null)

  async function loadSession(deckId: string, extend = false) {
    try {
      const data = await reviewsApi.getSession(deckId, extend)
      setSession(data)
      setDoneToday(data.reviewedToday)
      setCurrentIndex(0)
      setRevealed(false)
      setOpenAnswer('')
      setOpenResult(null)
      setLoadError(null)
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
      // Le nom du deck n'est qu'un repère : son échec ne bloque pas la révision.
      const [deck] = await Promise.allSettled([decksApi.get(deckId), loadSession(deckId)])
      if (deck.status === 'fulfilled') {
        setDeckName(deck.value.name)
        setCardCount(deck.value.cardCount ?? null)
      }
      setLoading(false)
    }

    void init(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate])

  const activeCard = session?.state === 'active' ? session.cards[currentIndex] : undefined

  // Carte suivante après une notation : le focus revient sur « Voir le verso »,
  // pour enchaîner au clavier comme au doigt.
  useEffect(() => {
    if (ratedRef.current && activeCard?.type === 'CLASSIC') revealRef.current?.focus({ preventScroll: true })
  }, [activeCard?.id, activeCard?.type])

  function reveal() {
    setRevealed(true)
    // Le bouton disparaît : le focus passe au verso, lu par les lecteurs d'écran.
    requestAnimationFrame(() => versoRef.current?.focus({ preventScroll: true }))
  }

  async function advance() {
    setRevealed(false)
    setOpenAnswer('')
    setOpenResult(null)

    if (!id || !session || session.state !== 'active') return

    if (currentIndex + 1 >= session.cards.length) {
      await loadSession(id, extended)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  async function handleContinueToday() {
    if (!id) return
    setContinuing(true)
    setExtended(true)
    await loadSession(id, true)
    setContinuing(false)
  }

  // Palier étendu atteint entre-temps (autre onglet) : l'API refuse, la session
  // rechargée affiche le voile.
  async function handleSubmitError(err: unknown, title: string, fallback: string) {
    if (err instanceof ApiError && err.status === 403 && id) {
      await loadSession(id, extended)
      return
    }
    notify({ tone: 'danger', title, message: err instanceof ApiError ? err.message : fallback })
  }

  async function handleRating(cardId: string, rating: ManualRating) {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setInked({ rating, at: Date.now() })
    try {
      await reviewsApi.submitClassic(cardId, rating)
      ratedRef.current = true
      setDoneToday((n) => n + 1)
      await advance()
    } catch (err) {
      await handleSubmitError(err, 'Enregistrement impossible', 'Impossible d’enregistrer la réponse')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  async function handleSubmitOpenQuestion(event: FormEvent, cardId: string) {
    event.preventDefault()
    if (submittingRef.current || !openAnswer.trim()) return

    submittingRef.current = true
    setSubmitting(true)
    try {
      const result = await reviewsApi.submitOpenQuestion(cardId, openAnswer.trim())
      setDoneToday((n) => n + 1)
      setOpenResult(result)
    } catch (err) {
      await handleSubmitError(err, 'Évaluation impossible', 'Impossible d’évaluer la réponse')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  // Raccourcis (CON-72) : Espace pour le verso, 1 à 4 pour noter une fois le verso
  // visible. Inactifs dans un champ de saisie, pendant un envoi et sous le voile.
  // Lus par une ref : l'écouteur est posé une seule fois.
  const shortcutState = { activeCard, revealed, submitting, veil: session?.state !== 'active' }
  const shortcutRef = useRef(shortcutState)
  shortcutRef.current = shortcutState
  const handlersRef = useRef({ reveal, handleRating })
  handlersRef.current = { reveal, handleRating }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
      if (isTypingTarget(event.target)) return
      const { activeCard: card, revealed: shown, submitting: busy, veil } = shortcutRef.current
      if (!card || card.type !== 'CLASSIC' || busy || veil) return

      if (event.key === ' ' && !shown) {
        // Sur un bouton ou un lien, Espace garde son rôle natif.
        if (event.target instanceof HTMLElement && event.target.closest('button, a')) return
        event.preventDefault()
        handlersRef.current.reveal()
        return
      }
      const match = RATINGS.find((r) => r.key === event.key)
      if (match && shown) {
        event.preventDefault()
        void handlersRef.current.handleRating(card.id, match.rating)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  if (loading) {
    return <PageSkeleton />
  }

  // Cible du cercle : le palier, puis le palier étendu une fois le palier dépassé.
  // Sous le voile, le cercle est toujours fermé.
  const target = !session
    ? 0
    : session.state === 'goal_reached'
      ? // Revenu plus tard après « Continuer aujourd'hui » : le cercle reste fermé.
        Math.min(session.extendedGoal, Math.max(session.dailyGoal, session.reviewedToday))
      : session.state === 'capped' || session.reviewedToday >= session.dailyGoal
        ? session.extendedGoal
        : session.dailyGoal
  const ratio = target > 0 ? Math.min(1, doneToday / target) : 0
  const veil = session && session.state !== 'active'

  const panels: [ReactNode, ReactNode, ReactNode] = [
    <Link
      key="back"
      to="/dashboard"
      aria-label="Retour à l’accueil"
      className="size-hit flex items-center justify-center rounded-full bg-cream-veil text-on-indigo hover:text-on-indigo"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="currentColor">
        <path d="M15.6 3.9C13 6.4 10.4 9 7.7 11.4c-.6.5-.6 1.1 0 1.6 2.7 2.4 5.3 4.9 7.6 7.4.5.5 1.1 0 .8-.6-1.9-2.5-4-4.9-6.2-7.4 2.3-2.4 4.7-4.9 6.6-7.5.4-.6-.3-1.4-.9-1z" />
      </svg>
    </Link>,
    // Pas de palier à montrer pour un deck encore vide.
    session && cardCount !== 0 ? (
      <BrushCircle key="goal" value={ratio * 100} label={`Palier du jour : ${doneToday} ${plural(doneToday, 'carte', 'cartes')} sur ${target}`} size="review" tone="cream">
        <span aria-hidden="true" className="text-label font-bold tabular-nums">
          {doneToday}/{target}
        </span>
      </BrushCircle>
    ) : null,
    <span key="deck" className="w-full text-center font-display text-body-sm font-bold line-clamp-2 break-words">
      {deckName}
    </span>,
  ]

  function renderContent() {
    if (loadError && !session) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="m-0 text-body-md">{loadError}</p>
          <BrushLink to="/decks" size="md">
            Retour aux decks
          </BrushLink>
        </div>
      )
    }
    if (!session || session.state !== 'active') return null

    if (!activeCard) {
      const empty = cardCount === 0
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="m-0 max-w-80 font-display text-display-sm">
            {empty ? 'Ce deck n’a pas encore de carte.' : 'Tu as fait le tour des cartes pour l’instant. Reviens plus tard.'}
          </p>
          <span className="self-center">
            <BrushLink to={`/decks/${id}`} size="md">
              {empty ? 'Ajouter des cartes' : 'Retour au deck'}
            </BrushLink>
          </span>
        </div>
      )
    }

    if (activeCard.type === 'CLASSIC') {
      return (
        <div className="flex-1 flex flex-col items-center gap-4">
          <RoundCard inkKey={activeCard.id} tag={<TypeTag type={activeCard.type} />}>
            <h1 className={`m-0 font-display break-words max-w-full ${frontSizeClass(activeCard.front)}`}>{frenchSpacing(activeCard.front)}</h1>
          </RoundCard>

          {/* Hauteur réservée : le verso prend la place du bouton sans rien décaler. */}
          <div className="w-full min-h-14 flex">
            {revealed ? (
              <div
                ref={versoRef}
                tabIndex={-1}
                className={`ink-in w-full flex items-center justify-center gap-3 px-6 py-3 border border-paper-card/70 bg-paper-card/70 backdrop-blur-md shadow-glass outline-none ${
                  activeCard.back.length > 40 ? 'rounded-lg' : 'rounded-pill'
                }`}
              >
                <span className="shrink-0 text-caption text-inksoft">Verso</span>
                <p className="m-0 min-w-0 font-display text-display-md font-medium break-words">{frenchSpacing(activeCard.back)}</p>
              </div>
            ) : (
              <button
                ref={revealRef}
                type="button"
                aria-keyshortcuts="Space"
                onClick={reveal}
                className="w-full h-14 rounded-pill border-2 border-dashed border-indigo/45 bg-paper-card/55 backdrop-blur-md font-body text-body-md font-bold text-indigo cursor-pointer"
              >
                Voir le verso
              </button>
            )}
          </div>

          <div className="mt-auto w-full">
            <RatingButtons disabled={!revealed || submitting} inked={inked} onRate={(rating) => handleRating(activeCard.id, rating)} />
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col items-center gap-4">
        <RoundCard inkKey={activeCard.id} small={Boolean(openResult)} tag={<TypeTag type={activeCard.type} />}>
          <h1 className={`m-0 font-display break-words max-w-full ${frontSizeClass(activeCard.front, Boolean(openResult))}`}>{frenchSpacing(activeCard.front)}</h1>
        </RoundCard>

        {openResult ? (
          <>
            <div className="relative -mt-7">
              <VerdictStamp verdict={openResult.aiVerdict} />
            </div>
            <AiFeedback result={openResult} reference={frenchSpacing(activeCard.back)} />
            <Button onClick={advance} className="w-full mt-auto">
              Carte suivante
            </Button>
          </>
        ) : (
          <form onSubmit={(event) => handleSubmitOpenQuestion(event, activeCard.id)} className="w-full flex flex-col gap-4">
            <Textarea label="Ta réponse" rows={3} value={openAnswer} onChange={(e) => setOpenAnswer(e.target.value)} disabled={submitting} />
            <Button type="submit" disabled={submitting || !openAnswer.trim()} className="w-full">
              <span className="grid">
                <span className={`col-start-1 row-start-1 ${submitting ? 'invisible' : ''}`}>Valider ma réponse</span>
                <span className={`col-start-1 row-start-1 ${submitting ? '' : 'invisible'}`}>Évaluation...</span>
              </span>
            </Button>
          </form>
        )}
      </div>
    )
  }

  return (
    <>
      <div inert={Boolean(veil)}>
        <AppScreen withTabs={false} norenPanels={panels} rise={ratio}>
          <ToastViewport toast={toast} />
          {renderContent()}
        </AppScreen>
      </div>
      {session?.state === 'goal_reached' ? (
        <ClosedVeil message={DAY_CLOSED_MESSAGE} onContinue={handleContinueToday} continuing={continuing} />
      ) : null}
      {session?.state === 'capped' ? <ClosedVeil message={frenchSpacing(session.message)} /> : null}
    </>
  )
}

export default Review
