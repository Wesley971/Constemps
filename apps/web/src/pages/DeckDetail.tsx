import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, cardsApi, decksApi, translationApi, ApiError } from '../services/api'
import type { Deck, DeckColor, DeckIcon } from '../types/deck'
import type { Card as CardData, CardType } from '../types/card'
import type { TranslationResult } from '../types/translation'
import { AppScreen } from '../design-system/components/AppScreen'
import { BackLink } from '../design-system/components/BackLink'
import { BrushLink } from '../design-system/components/BrushLink'
import { Button } from '../design-system/components/Button'
import { DeckPlaque } from '../design-system/components/EmaPlaque'
import { IconButton } from '../design-system/components/IconButton'
import { InkRule } from '../design-system/components/InkRule'
import { Input } from '../design-system/components/Input'
import { Radio } from '../design-system/components/Radio'
import { ConfirmModal } from '../design-system/components/Modal'
import { ToastViewport } from '../design-system/components/ToastViewport'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
import { useToast } from '../design-system/useToast'
import { CARD_TYPE_LABELS, CARD_TYPE_ICONS, CARD_TYPE_HELP } from '../design-system/constants'
import { deckCountsLabel, deckToday, deckTodayLabel } from '../lib/today'
import { frenchSpacing } from '../lib/typography'
import { DeckFormModal } from './DeckFormModal'
import { GenerateCardsModal } from './GenerateCardsModal'

const FIELD_LABELS: Record<CardType, { front: string; back: string }> = {
  CLASSIC: { front: 'Recto', back: 'Verso' },
  OPEN_QUESTION: { front: 'Question', back: 'Réponse de référence' },
}

const CARD_TYPE_OPTIONS = [
  { value: 'CLASSIC', label: CARD_TYPE_LABELS.CLASSIC, icon: CARD_TYPE_ICONS.CLASSIC, helpText: CARD_TYPE_HELP.CLASSIC },
  { value: 'OPEN_QUESTION', label: CARD_TYPE_LABELS.OPEN_QUESTION, icon: CARD_TYPE_ICONS.OPEN_QUESTION, helpText: CARD_TYPE_HELP.OPEN_QUESTION },
]

// Libellés tirés du navigateur plutôt que d'une liste locale : la liste des
// langues gérées vit uniquement côté back (CON-55), et la langue source
// détectée peut être n'importe laquelle (espagnol, italien...).
const languageNames = new Intl.DisplayNames(['fr'], { type: 'language' })

function languageLabel(code: string): string {
  try {
    return languageNames.of(code.toLowerCase()) ?? code
  } catch {
    return code
  }
}

// Dernière traduction appliquée au verso, gardée avec le recto qui l'a produite :
// le bouton "Inverser" et la ligne d'aide n'ont de sens que tant que ce recto
// est inchangé, aucune persistance au-delà de la carte en cours.
interface AppliedTranslation extends TranslationResult {
  front: string
}

// Intérieur d'un deck (CON-69, S15-deck). La plaquette compte comme l'accueil
// et Mes decks ; ajout, génération et modification des cartes gardent leur
// comportement, seul l'habillage change (fenêtres en rideau au lot 4).
function DeckDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast, notify } = useToast()

  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<CardData[]>([])
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [editingDeck, setEditingDeck] = useState(false)
  const [savingDeck, setSavingDeck] = useState(false)
  const [deletingDeck, setDeletingDeck] = useState(false)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCardType, setNewCardType] = useState<CardType>('CLASSIC')
  const [newCardFront, setNewCardFront] = useState('')
  const [newCardBack, setNewCardBack] = useState('')
  const [creating, setCreating] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [appliedTranslation, setAppliedTranslation] = useState<AppliedTranslation | null>(null)
  // Recto courant lisible après un await, pour ignorer une traduction revenue
  // alors que l'utilisateur a déjà modifié le recto.
  const latestFrontRef = useRef(newCardFront)
  latestFrontRef.current = newCardFront

  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

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

  async function handleSubmitDeck(name: string, color: DeckColor | null, icon: DeckIcon | null) {
    if (!deck) return
    setSavingDeck(true)
    try {
      const updated = await decksApi.update(deck.id, name, color, icon)
      // Fusion : la réponse ne porte pas les champs du jour (palier, dues).
      setDeck((prev) => (prev ? { ...prev, ...updated } : prev))
      setEditingDeck(false)
    } catch (err) {
      notify({ tone: 'danger', title: 'Modification impossible', message: err instanceof ApiError ? err.message : 'Une erreur est survenue' })
    } finally {
      setSavingDeck(false)
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

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!id || !newCardFront.trim() || !newCardBack.trim()) return

    setCreating(true)
    try {
      const card = await cardsApi.create(id, newCardType, newCardFront.trim(), newCardBack.trim())
      setCards((prev) => [card, ...prev])
      setNewCardFront('')
      setNewCardBack('')
      setAppliedTranslation(null)
      setShowCreateForm(false)
      void refreshDeck()
    } catch (err) {
      notify({ tone: 'danger', title: 'Création impossible', message: err instanceof ApiError ? err.message : 'Impossible de créer la carte' })
    } finally {
      setCreating(false)
    }
  }

  // forceSourceIsFrench absent : détection automatique côté back. Présent : bouton
  // "Inverser", qui impose le verdict opposé à celui de la traduction affichée.
  async function handleTranslate(forceSourceIsFrench?: boolean) {
    const front = newCardFront.trim()
    if (!front) return

    setTranslating(true)
    try {
      const result = await translationApi.translate(front, forceSourceIsFrench)
      if (latestFrontRef.current.trim() !== front) return
      setNewCardBack(result.translation)
      setAppliedTranslation({ ...result, front })
    } catch (err) {
      notify({ tone: 'danger', title: 'Traduction indisponible', message: err instanceof ApiError ? err.message : 'Réessaie plus tard.' })
    } finally {
      setTranslating(false)
    }
  }

  // Dérivés plutôt que remis à zéro à la main : modifier le recto masque le bouton
  // "Inverser" et la ligne d'aide, modifier le verso masque la ligne d'aide, qui ne
  // décrirait plus le contenu affiché.
  const translationForFront = appliedTranslation?.front === newCardFront.trim() ? appliedTranslation : null
  const translationHint =
    translationForFront && newCardBack === translationForFront.translation
      ? `Traduction ${languageLabel(translationForFront.sourceLang)} → ${languageLabel(translationForFront.targetLang)}`
      : null

  function startEdit(card: CardData) {
    setEditingCardId(card.id)
    setEditFront(card.front)
    setEditBack(card.back)
  }

  function cancelEdit() {
    setEditingCardId(null)
  }

  async function handleSaveEdit(cardId: string) {
    if (!editFront.trim() || !editBack.trim()) return

    setSavingEdit(true)
    try {
      const updated = await cardsApi.update(cardId, editFront.trim(), editBack.trim())
      setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)))
      setEditingCardId(null)
    } catch (err) {
      notify({ tone: 'danger', title: 'Modification impossible', message: err instanceof ApiError ? err.message : 'Impossible de modifier la carte' })
    } finally {
      setSavingEdit(false)
    }
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
      <ToastViewport toast={toast} />

      <div className="flex items-center justify-between gap-2">
        <BackLink to="/decks">Mes decks</BackLink>
        <div className="flex">
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
        <Button variant="secondary" icon={showCreateForm ? 'ph:x-bold' : 'ph:plus-bold'} onClick={() => setShowCreateForm((v) => !v)}>
          {showCreateForm ? 'Annuler' : 'Ajouter'}
        </Button>
        <Button variant="secondary" icon="ph:sparkle-bold" onClick={() => setShowGenerateModal(true)}>
          Générer
        </Button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Radio name="cardType" options={CARD_TYPE_OPTIONS} value={newCardType} onChange={(v) => setNewCardType(v as CardType)} />
          <Input label={FIELD_LABELS[newCardType].front} value={newCardFront} onChange={(e) => setNewCardFront(e.target.value)} required />
          <div className="flex flex-col gap-1">
            <Input label={FIELD_LABELS[newCardType].back} value={newCardBack} onChange={(e) => setNewCardBack(e.target.value)} required />
            {/* Sous le Verso plutôt qu'à côté : sur mobile, deux boutons à droite du
                champ l'écrasaient. Deux colonnes égales, comme Ajouter / Générer. */}
            {newCardType === 'CLASSIC' && (
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" disabled={translating || !newCardFront.trim()} onClick={() => handleTranslate()}>
                  {/* Les deux libellés sont superposés dans la même cellule de grille : le bouton
                      prend la largeur du plus long et ne bouge plus quand l'état change.
                      invisible retire le libellé masqué des lecteurs d'écran. */}
                  <span className="grid">
                    <span className={`col-start-1 row-start-1 ${translating ? 'invisible' : ''}`}>Traduire</span>
                    <span className={`col-start-1 row-start-1 ${translating ? '' : 'invisible'}`}>Traduction...</span>
                  </span>
                </Button>
                {/* Toujours monté, masqué par visibility:hidden tant qu'il ne s'applique pas :
                    son apparition ne doit pas décaler "Traduire".
                    invisible le retire aussi du clavier et des lecteurs d'écran. */}
                <Button
                  type="button"
                  variant="secondary"
                  icon="ph:arrows-left-right-bold"
                  disabled={translating || !translationForFront}
                  onClick={() => translationForFront && handleTranslate(!translationForFront.sourceIsFrench)}
                  className={translationForFront ? '' : 'invisible'}
                >
                  Inverser
                </Button>
              </div>
            )}
            {newCardType === 'CLASSIC' && (
              // Toujours monté, avec sa hauteur réservée par une espace insécable quand il
              // est vide : une région aria-live doit exister avant que son contenu change
              // pour être annoncée, et son apparition ne doit pas décaler le bouton de création.
              <p aria-live="polite" className="m-0 font-body text-caption text-inksoft">
                {translationHint ?? ' '}
              </p>
            )}
          </div>

          <Button type="submit" disabled={creating} className="w-full">
            {creating ? 'Création...' : 'Créer la carte'}
          </Button>
        </form>
      )}

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
                {editingCardId === card.id ? (
                  <div className="flex flex-col gap-2 py-2">
                    <Input label={FIELD_LABELS[card.type].front} value={editFront} onChange={(e) => setEditFront(e.target.value)} />
                    <Input label={FIELD_LABELS[card.type].back} value={editBack} onChange={(e) => setEditBack(e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" onClick={cancelEdit}>
                        Annuler
                      </Button>
                      <Button variant="compact" disabled={savingEdit} onClick={() => handleSaveEdit(card.id)}>
                        <span className="grid">
                          <span className={`col-start-1 row-start-1 ${savingEdit ? 'invisible' : ''}`}>Enregistrer</span>
                          <span className={`col-start-1 row-start-1 ${savingEdit ? '' : 'invisible'}`}>Enregistrement...</span>
                        </span>
                      </Button>
                    </div>
                  </div>
                ) : (
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
                    <IconButton icon="edit" label={`Modifier la carte « ${card.front} »`} onClick={() => startEdit(card)} />
                    <IconButton icon="delete" label={`Supprimer la carte « ${card.front} »`} onClick={() => setCardToDelete(card)} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {cardToDelete && (
        <ConfirmModal
          title="Supprimer cette carte ?"
          confirmLabel="Supprimer"
          confirmVariant="danger"
          onConfirm={confirmDeleteCard}
          onClose={() => setCardToDelete(null)}
        >
          Cette action est irréversible.
        </ConfirmModal>
      )}

      {deletingDeck && (
        <ConfirmModal
          title="Supprimer ce deck ?"
          confirmLabel="Supprimer"
          confirmVariant="danger"
          onConfirm={confirmDeleteDeck}
          onClose={() => setDeletingDeck(false)}
        >
          Le deck « {deck.name} » et toutes ses cartes seront supprimés définitivement. Cette action est irréversible.
        </ConfirmModal>
      )}

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
