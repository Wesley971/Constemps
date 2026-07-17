import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, cardsApi, decksApi, translationApi, ApiError } from '../services/api'
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
import { useToast } from '../design-system/useToast'
import { GenerateCardsModal } from './GenerateCardsModal'

const FIELD_LABELS: Record<CardType, { front: string; back: string }> = {
  CLASSIC: { front: 'Recto', back: 'Verso' },
  OPEN_QUESTION: { front: 'Question', back: 'Réponse de référence' },
}

const CARD_TYPE_OPTIONS = [
  { value: 'CLASSIC', label: 'Rappel classique' },
  { value: 'OPEN_QUESTION', label: 'Question ouverte' },
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
      } catch (err) {
        notify({ tone: 'danger', title: 'Chargement impossible', message: err instanceof ApiError ? err.message : 'Impossible de charger le deck' })
      } finally {
        setCheckingAuth(false)
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
      const { translation } = await translationApi.translate(newCardFront.trim(), 'EN')
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

  if (checkingAuth) {
    return <PageSkeleton />
  }

  return (
    <div className="wrap">
      <ToastViewport toast={toast} />

      <p style={{ margin: '4px 0 20px' }}>
        <Link to="/decks">Retour aux decks</Link>
      </p>
      <h1 style={{ font: 'var(--text-display-lg)', color: 'var(--ink)', letterSpacing: 'var(--tracking-tight)', margin: '0 0 16px' }}>
        {deck?.name}
      </h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <LinkButton to={`/decks/${id}/review`} variant="primary" icon="ph:play-bold">
          Réviser
        </LinkButton>
        <LinkButton to={`/decks/${id}/stats`} variant="ghost" icon="ph:chart-bar-bold">
          Stats
        </LinkButton>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <Button variant="ghost" icon={showCreateForm ? 'ph:x-bold' : 'ph:plus-bold'} onClick={() => setShowCreateForm((v) => !v)}>
          {showCreateForm ? 'Annuler' : 'Ajouter une card'}
        </Button>
        <Button variant="ghost" icon="ph:sparkle-bold" onClick={() => setShowGenerateModal(true)}>
          Générer des cards depuis un texte
        </Button>
      </div>

      {showCreateForm && (
        <Card style={{ padding: 24, marginBottom: 24 }}>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 16 }}>
              <Radio name="cardType" options={CARD_TYPE_OPTIONS} value={newCardType} onChange={(v) => setNewCardType(v as CardType)} inline />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Input
                label={FIELD_LABELS[newCardType].front}
                value={newCardFront}
                onChange={(e) => setNewCardFront(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <Input
                  label={FIELD_LABELS[newCardType].back}
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                  required
                  style={{ flex: 1 }}
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
        <p style={{ font: 'var(--text-body-md)', color: 'var(--inksoft)' }}>Aucune card pour l'instant.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cards.map((card) => (
            <Card key={card.id} style={{ padding: 20 }}>
              {editingCardId === card.id ? (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <Input label={FIELD_LABELS[card.type].front} value={editFront} onChange={(e) => setEditFront(e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Input label={FIELD_LABELS[card.type].back} value={editBack} onChange={(e) => setEditBack(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button disabled={savingEdit} onClick={() => handleSaveEdit(card.id)}>
                      {savingEdit ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button variant="ghost" onClick={cancelEdit}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <Badge tone={card.type === 'CLASSIC' ? 'neutral' : 'teal'}>
                        {card.type === 'CLASSIC' ? 'Rappel classique' : 'Question ouverte'}
                      </Badge>
                    </div>
                    <p style={{ font: 'var(--text-body-md)', color: 'var(--ink)', margin: 0 }}>
                      {card.front} <span style={{ color: 'var(--inksoft)' }}>/</span> {card.back}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <IconCircleButton icon="ph:pencil-simple-bold" tone="ghost" size={32} title="Éditer" onClick={() => startEdit(card)} />
                    <IconCircleButton icon="ph:trash-bold" tone="ghost" size={32} title="Supprimer" onClick={() => setCardToDelete(card)} />
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
