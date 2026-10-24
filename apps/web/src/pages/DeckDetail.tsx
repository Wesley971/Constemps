import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, cardsApi, decksApi, ApiError } from '../services/api'
import type { Deck, DeckColor } from '../types/deck'
import type { Card as CardData } from '../types/card'
import { AppScreen } from '../design-system/components/AppScreen'
import { BackLink } from '../design-system/components/BackLink'
import { BrushLink } from '../design-system/components/BrushLink'
import { Button } from '../design-system/components/Button'
import { CurtainConfirm } from '../design-system/components/Curtain'
import { DeckPlaque } from '../design-system/components/EmaPlaque'
import { FavoriteKnot } from '../design-system/components/FavoriteKnot'
import { IconButton } from '../design-system/components/IconButton'
import { InkRule } from '../design-system/components/InkRule'
import { ToastViewport } from '../design-system/components/ToastViewport'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
import { useToast } from '../design-system/useToast'
import { CARD_TYPE_LABELS, deckKnotClass } from '../design-system/constants'
import { deckCountsLabel, deckToday, deckTodayLabel } from '../lib/today'
import { frenchSpacing } from '../lib/typography'
import { CardFormCurtain } from './CardFormCurtain'
import { DeckFormModal } from './DeckFormModal'
import { GenerateCardsModal } from './GenerateCardsModal'

// Rideau de carte ouvert : nouvelle carte, ou modification de celle-ci.
type CardCurtainState = { mode: 'create' } | { mode: 'edit'; card: CardData } | null

// Intérieur d'un deck (CON-69, S15-deck). La plaquette compte comme l'accueil
// et Mes decks ; ajout, modification et génération des cartes, modification et
// suppression du deck passent par des rideaux (CON-70).
function DeckDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast, notify, dismiss } = useToast()

  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<CardData[]>([])
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [editingDeck, setEditingDeck] = useState(false)
  const [savingDeck, setSavingDeck] = useState(false)
  const [deletingDeck, setDeletingDeck] = useState(false)
  // Favori (CON-74) : garde contre un double envoi, nœud serré seulement au clic.
  const favoriteBusy = useRef(false)
  const [tightenFavorite, setTightenFavorite] = useState(false)

  const [cardCurtain, setCardCurtain] = useState<CardCurtainState>(null)

  const [cardToDelete, setCardToDelete] = useState<CardData | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)

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
        const [deckData, cardsData] = await Promise.all([decksApi.get(deckId), cardsApi.list(deckId)])
        setDeck(deckData)
        setCards(cardsData)
        setCheckingAuth(false)
      } catch (err) {
        navigate('/decks', {
          state: {
            notify: {
              tone: 'danger',
              title: 'Deck introuvable',
              message: err instanceof ApiError ? err.message : 'Ce deck est introuvable ou a été supprimé.',
            },
          },
        })
      }
    }

    void init(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate])

  // Une carte ajoutée est due tout de suite : dues, objectif et restantes
  // changent. On relit le deck plutôt que de recalculer à la main. En cas
  // d'échec, la plaquette garde son dernier état, sans bloquer l'écran.
  async function refreshDeck() {
    if (!id) return
    try {
      setDeck(await decksApi.get(id))
    } catch {
      // Rien à faire : la prochaine visite relira le deck.
    }
  }

  async function handleSubmitDeck(name: string, color: DeckColor | null) {
    if (!deck) return
    setSavingDeck(true)
    try {
      // L'icône n'est plus choisie (CON-70) : on renvoie celle en base pour ne pas l'effacer.
      const updated = await decksApi.update(deck.id, name, color, deck.icon)
      // Fusion : la réponse ne porte pas les champs du jour (palier, dues).
      setDeck((prev) => (prev ? { ...prev, ...updated } : prev))
      setEditingDeck(false)
    } catch (err) {
      notify({ tone: 'danger', title: 'Modification impossible', message: err instanceof ApiError ? err.message : 'Une erreur est survenue' })
    } finally {
      setSavingDeck(false)
    }
  }

  // Favori (CON-74) : affiché tout de suite, annulé avec une notification si
  // l'API refuse. Un seul envoi à la fois ; le nœud ne se serre qu'à la mise
  // en favori, jamais à l'ouverture de la page.
  async function toggleFavorite() {
    if (!deck || favoriteBusy.current) return
    favoriteBusy.current = true
    const previous = deck.isFavorite
    const next = !previous
    setTightenFavorite(next)
    setDeck((prev) => (prev ? { ...prev, isFavorite: next } : prev))
    try {
      await decksApi.setFavorite(deck.id, next)
    } catch (err) {
      setDeck((prev) => (prev ? { ...prev, isFavorite: previous } : prev))
      setTightenFavorite(false)
      notify({ tone: 'danger', title: 'Favori non enregistré', message: err instanceof ApiError ? err.message : 'Réessaie dans un instant.' })
    } finally {
      favoriteBusy.current = false
    }
  }

  async function confirmDeleteDeck() {
    if (!deck) return
    setDeletingDeck(false)
    try {
      await decksApi.remove(deck.id)
      navigate('/decks', { state: { notify: { tone: 'success', title: 'Deck supprimé', message: `« ${deck.name} » a été supprimé.` } } })
    } catch (err) {
      notify({ tone: 'danger', title: 'Suppression impossible', message: err instanceof ApiError ? err.message : 'Impossible de supprimer le deck' })
    }
  }

  // Carte créée ou modifiée dans le rideau : une carte créée est due tout de suite,
  // d'où la relecture du deck.
  function handleCardSaved(saved: CardData) {
    setCards((prev) => (prev.some((c) => c.id === saved.id) ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev]))
    setCardCurtain(null)
    void refreshDeck()
  }

  async function confirmDeleteCard() {
    if (!cardToDelete) return
    const card = cardToDelete
    setCardToDelete(null)

    try {
      await cardsApi.remove(card.id)
      setCards((prev) => prev.filter((c) => c.id !== card.id))
      notify({ tone: 'success', title: 'Carte supprimée' })
      void refreshDeck()
    } catch (err) {
      notify({ tone: 'danger', title: 'Suppression impossible', message: err instanceof ApiError ? err.message : 'Impossible de supprimer la carte' })
    }
  }

  if (checkingAuth || !deck) {
    return <PageSkeleton />
  }

  const today = deckToday(deck)
  const status = deckTodayLabel(today)

  return (
    <AppScreen>
      <ToastViewport toast={toast} onDismiss={dismiss} />

      <div className="flex items-center justify-between gap-2">
        <BackLink to="/decks">Mes decks</BackLink>
        <div className="flex">
          {/* Favori (CON-74) : vrai bouton bascule, libellé fixe et aria-pressed. */}
          <button
            type="button"
            aria-pressed={deck.isFavorite}
            aria-label="Favori"
            title={deck.isFavorite ? 'Retirer des favoris' : 'Mettre en favori'}
            onClick={toggleFavorite}
            className="size-hit shrink-0 inline-flex items-center justify-center p-0 border-none rounded-sm bg-transparent text-inksoft cursor-pointer transition-colors duration-base ease-standard hover:text-indigo hover:bg-indigo-tint"
          >
            {deck.isFavorite ? (
              <FavoriteKnot filled tighten={tightenFavorite} className={`size-6 ${deckKnotClass(deck.color)}`} />
            ) : (
              <FavoriteKnot className="size-6" />
            )}
          </button>
          <IconButton icon="edit" label="Modifier le deck" onClick={() => setEditingDeck(true)} />
          <IconButton icon="delete" label="Supprimer le deck" onClick={() => setDeletingDeck(true)} />
        </div>
      </div>

      <section aria-label="Aujourd'hui" className="flex items-start gap-5">
        <DeckPlaque
          remaining={today.remaining}
          // Le chiffre est dans le cercle : la plaquette n'écrit que « à revoir ».
          status={today.status === 'todo' ? 'à revoir' : status}
          label={status}
          progress={today.progress}
          color={deck.color}
          closeKey={today.done > 0 ? `deck-${deck.id}` : undefined}
        />
        <div className="flex-1 min-w-0 flex flex-col gap-1 pt-4">
          <h1 className="m-0 font-display text-display-lg break-words">{deck.name}</h1>
          <p className="m-0 text-body-sm text-inksoft">{deckCountsLabel(deck)}</p>
          <BrushLink to={`/decks/${deck.id}/review`} disabled={cards.length === 0} delayMs={900}>
            Réviser
          </BrushLink>
          <Link
            to={`/decks/${deck.id}/stats`}
            className="self-start min-h-hit inline-flex items-center text-body-sm font-bold text-inksoft no-underline hover:no-underline hover:text-indigo"
          >
            Voir les stats
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon="ph:plus-bold" onClick={() => setCardCurtain({ mode: 'create' })}>
          Ajouter
        </Button>
        <Button variant="secondary" icon="ph:sparkle-bold" onClick={() => setShowGenerateModal(true)}>
          Générer
        </Button>
      </div>

      <section aria-labelledby="les-cartes" className="flex flex-col">
        <div className="flex items-baseline justify-between">
          <h2 id="les-cartes" className="m-0 font-display text-display-sm">
            Les cartes
          </h2>
          <span className="text-label font-normal text-inksoft">{cards.length}</span>
        </div>

        {cards.length === 0 ? (
          <p className="m-0 pt-2 text-body-sm text-inksoft">Aucune carte pour l’instant.</p>
        ) : (
          <ul className="m-0 p-0 list-none flex flex-col">
            {cards.map((card, index) => (
              <li key={card.id} className="flex flex-col">
                {index > 0 ? <InkRule /> : null}
                <div className="flex items-center gap-2 py-2">
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    {card.type === 'OPEN_QUESTION' ? (
                      <span className="inline-flex items-center gap-1 text-micro uppercase tracking-micro text-vermillon">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3" fill="currentColor">
                          <path d="M12 3c.8 4.6 2.6 7 7.5 9-4.9 2-6.7 4.4-7.5 9-.8-4.6-2.6-7-7.5-9 4.9-2 6.7-4.4 7.5-9z" />
                        </svg>
                        {CARD_TYPE_LABELS.OPEN_QUESTION}
                      </span>
                    ) : null}
                    <span className="font-display text-display-sm break-words">{frenchSpacing(card.front)}</span>
                    <span className="text-body-sm text-inksoft break-words">{frenchSpacing(card.back)}</span>
                  </div>
                  <IconButton icon="edit" label={`Modifier la carte « ${card.front} »`} onClick={() => setCardCurtain({ mode: 'edit', card })} />
                  <IconButton icon="delete" label={`Supprimer la carte « ${card.front} »`} onClick={() => setCardToDelete(card)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {cardToDelete && (
        <CurtainConfirm title="Supprimer cette carte ?" confirmLabel="Supprimer" danger onConfirm={confirmDeleteCard} onClose={() => setCardToDelete(null)}>
          <p className="m-0">
            La carte <span className="font-display font-bold">« {frenchSpacing(cardToDelete.front)} »</span> et son historique de révision seront supprimés.
            Cette action est irréversible.
          </p>
        </CurtainConfirm>
      )}

      {deletingDeck && (
        <CurtainConfirm title="Supprimer ce deck ?" confirmLabel="Supprimer" danger onConfirm={confirmDeleteDeck} onClose={() => setDeletingDeck(false)}>
          <p className="m-0">
            Le deck <span className="font-display font-bold">« {deck.name} »</span>, toutes ses cartes et leur historique de révision seront supprimés.
            Cette action est irréversible.
          </p>
        </CurtainConfirm>
      )}

      {cardCurtain && id ? (
        <CardFormCurtain
          // Nouvelle instance par carte : aucun état ne passe d'une carte à l'autre.
          key={cardCurtain.mode === 'edit' ? cardCurtain.card.id : 'nouvelle-carte'}
          deckId={id}
          card={cardCurtain.mode === 'edit' ? cardCurtain.card : null}
          onClose={() => setCardCurtain(null)}
          onSaved={handleCardSaved}
          notify={notify}
        />
      ) : null}

      {editingDeck && <DeckFormModal deck={deck} saving={savingDeck} onClose={() => setEditingDeck(false)} onSubmit={handleSubmitDeck} />}

      {showGenerateModal && id && (
        <GenerateCardsModal
          deckId={id}
          onClose={() => setShowGenerateModal(false)}
          onCardsAdded={(newCards) => {
            setCards((prev) => [...newCards, ...prev])
            void refreshDeck()
          }}
          notify={notify}
        />
      )}
    </AppScreen>
  )
}

export default DeckDetail
