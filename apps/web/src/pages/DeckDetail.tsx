import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, cardsApi, decksApi, translationApi, audioUrl, ApiError } from '../services/api'
import type { Deck } from '../types/deck'
import type { Card as CardData, CardType } from '../types/card'
import { Card } from '../design-system/components/Card'
import { Badge } from '../design-system/components/Badge'
import { Button, LinkButton } from '../design-system/components/Button'
import { Input } from '../design-system/components/Input'
import { Radio } from '../design-system/components/Radio'
import { IconCircleButton } from '../design-system/components/IconCircleButton'
import { ConfirmModal } from '../design-system/components/Modal'
import { ToastViewport } from '../design-system/components/ToastViewport'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
import { Skeleton } from '../design-system/components/Skeleton'
import { useToast } from '../design-system/useToast'
import { CARD_TYPE_LABELS } from '../design-system/constants'
import { GenerateCardsModal } from './GenerateCardsModal'

const FIELD_LABELS: Record<CardType, { front: string; back: string }> = {
  CLASSIC: { front: 'Recto', back: 'Verso' },
  OPEN_QUESTION: { front: 'Question', back: 'Réponse de référence' },
}

const CARD_TYPE_OPTIONS = [
  { value: 'CLASSIC', label: CARD_TYPE_LABELS.CLASSIC },
  { value: 'OPEN_QUESTION', label: CARD_TYPE_LABELS.OPEN_QUESTION },
]

function DeckDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast, notify } = useToast()

  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<CardData[]>([])
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCardType, setNewCardType] = useState<CardType>('CLASSIC')
  const [newCardFront, setNewCardFront] = useState('')
  const [newCardBack, setNewCardBack] = useState('')
  const [creating, setCreating] = useState(false)
  const [translating, setTranslating] = useState(false)

  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const [cardToDelete, setCardToDelete] = useState<CardData | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generatingAudioId, setGeneratingAudioId] = useState<string | null>(null)

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

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!id || !newCardFront.trim() || !newCardBack.trim()) return

    setCreating(true)
    try {
      const card = await cardsApi.create(id, newCardType, newCardFront.trim(), newCardBack.trim())
      setCards((prev) => [card, ...prev])
      setNewCardFront('')
      setNewCardBack('')
      setShowCreateForm(false)
    } catch (err) {
      notify({ tone: 'danger', title: 'Création impossible', message: err instanceof ApiError ? err.message : 'Impossible de créer la card' })
    } finally {
      setCreating(false)
    }
  }

  async function handleTranslate() {
    if (!newCardFront.trim()) return

    setTranslating(true)
    try {
      const { translation } = await translationApi.translate(newCardFront.trim(), 'FR')
      setNewCardBack(translation)
    } catch (err) {
      notify({ tone: 'danger', title: 'Traduction indisponible', message: err instanceof ApiError ? err.message : 'Réessaie plus tard.' })
    } finally {
      setTranslating(false)
    }
  }

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
      notify({ tone: 'danger', title: 'Modification impossible', message: err instanceof ApiError ? err.message : 'Impossible de modifier la card' })
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
      notify({ tone: 'success', title: 'Card supprimée' })
    } catch (err) {
      notify({ tone: 'danger', title: 'Suppression impossible', message: err instanceof ApiError ? err.message : 'Impossible de supprimer la card' })
    }
  }

  async function handleGenerateAudio(cardId: string) {
    setGeneratingAudioId(cardId)
    try {
      const updated = await cardsApi.generateAudio(cardId)
      setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)))
    } catch (err) {
      notify({
        tone: 'danger',
        title: 'Génération audio impossible',
        message: err instanceof ApiError ? err.message : "Impossible de générer l'audio",
      })
    } finally {
      setGeneratingAudioId(null)
    }
  }

  function handlePlayAudio(path: string) {
    new Audio(audioUrl(path)).play().catch(() => {})
  }

  if (checkingAuth) {
    return <PageSkeleton />
  }

  return (
    <div className="max-w-wrap mx-auto">
      <ToastViewport toast={toast} />

      <p className="mt-1 mb-5">
        <Link to="/decks">Retour aux decks</Link>
      </p>
      <h1 className="font-display text-display-lg text-ink tracking-tight m-0 mb-4">{deck?.name}</h1>

      <div className="flex gap-2.5 mb-5">
        {cards.length > 0 ? (
          <LinkButton to={`/decks/${id}/review`} variant="primary" icon="ph:play-bold">
            Réviser
          </LinkButton>
        ) : (
          <Button variant="primary" icon="ph:play-bold" disabled>
            Réviser
          </Button>
        )}
        <LinkButton to={`/decks/${id}/stats`} variant="ghost" icon="ph:chart-bar-bold">
          Stats
        </LinkButton>
      </div>

      <div className="flex gap-2.5 mb-5 flex-wrap">
        <Button variant="ghost" icon={showCreateForm ? 'ph:x-bold' : 'ph:plus-bold'} onClick={() => setShowCreateForm((v) => !v)}>
          {showCreateForm ? 'Annuler' : 'Ajouter une card'}
        </Button>
        <Button variant="ghost" icon="ph:sparkle-bold" onClick={() => setShowGenerateModal(true)}>
          Générer des cards depuis un texte
        </Button>
      </div>

      {showCreateForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleCreate}>
            <div className="mb-4">
              <Radio name="cardType" options={CARD_TYPE_OPTIONS} value={newCardType} onChange={(v) => setNewCardType(v as CardType)} inline />
            </div>

            <div className="mb-4">
              <Input
                label={FIELD_LABELS[newCardType].front}
                value={newCardFront}
                onChange={(e) => setNewCardFront(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <div className="flex gap-2.5 items-end">
                <Input
                  label={FIELD_LABELS[newCardType].back}
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                  required
                  className="flex-1"
                />
                {newCardType === 'CLASSIC' && (
                  <Button type="button" variant="ghost" disabled={translating || !newCardFront.trim()} onClick={handleTranslate}>
                    {translating ? 'Traduction...' : 'Traduire'}
                  </Button>
                )}
              </div>
            </div>

            <Button type="submit" disabled={creating}>
              {creating ? 'Création...' : 'Créer la card'}
            </Button>
          </form>
        </Card>
      )}

      {cards.length === 0 ? (
        <p className="font-body text-body-md text-inksoft">Aucune card pour l'instant.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <Card key={card.id} className="p-5">
              {editingCardId === card.id ? (
                <div>
                  <div className="mb-3">
                    <Input label={FIELD_LABELS[card.type].front} value={editFront} onChange={(e) => setEditFront(e.target.value)} />
                  </div>
                  <div className="mb-4">
                    <Input label={FIELD_LABELS[card.type].back} value={editBack} onChange={(e) => setEditBack(e.target.value)} />
                  </div>
                  <div className="flex gap-2.5">
                    <Button disabled={savingEdit} onClick={() => handleSaveEdit(card.id)}>
                      {savingEdit ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button variant="ghost" onClick={cancelEdit}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div>
                      <Badge tone={card.type === 'CLASSIC' ? 'neutral' : 'accent'}>{CARD_TYPE_LABELS[card.type]}</Badge>
                    </div>
                    <p className="font-body text-body-md text-ink m-0">
                      {card.front} <span className="text-inksoft">/</span> {card.back}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 items-center">
                    {generatingAudioId === card.id ? (
                      <Skeleton className="w-8 h-8" radius="full" />
                    ) : card.audioUrl ? (
                      <IconCircleButton
                        icon="ph:speaker-high-bold"
                        tone="ghost"
                        size="md"
                        title="Écouter"
                        onClick={() => handlePlayAudio(card.audioUrl!)}
                      />
                    ) : (
                      <IconCircleButton
                        icon="ph:waveform-bold"
                        tone="ghost"
                        size="md"
                        title="Générer l'audio"
                        onClick={() => handleGenerateAudio(card.id)}
                      />
                    )}
                    <IconCircleButton icon="ph:pencil-simple-bold" tone="ghost" size="md" title="Éditer" onClick={() => startEdit(card)} />
                    <IconCircleButton icon="ph:trash-bold" tone="ghost" size="md" title="Supprimer" onClick={() => setCardToDelete(card)} />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {cardToDelete && (
        <ConfirmModal
          title="Supprimer cette card ?"
          confirmLabel="Supprimer"
          confirmVariant="danger"
          onConfirm={confirmDeleteCard}
          onClose={() => setCardToDelete(null)}
        >
          Cette action est irréversible.
        </ConfirmModal>
      )}

      {showGenerateModal && id && (
        <GenerateCardsModal
          deckId={id}
          onClose={() => setShowGenerateModal(false)}
          onCardsAdded={(newCards) => setCards((prev) => [...newCards, ...prev])}
          notify={notify}
        />
      )}
    </div>
  )
}

export default DeckDetail
