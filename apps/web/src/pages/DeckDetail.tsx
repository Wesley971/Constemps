import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, cardsApi, decksApi, translationApi, ApiError } from '../services/api'
import type { Deck } from '../types/deck'
import type { Card, CardType } from '../types/card'

const FIELD_LABELS: Record<CardType, { front: string; back: string }> = {
  CLASSIC: { front: 'Recto', back: 'Verso' },
  OPEN_QUESTION: { front: 'Question', back: 'Réponse de référence' },
}

function DeckDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCardType, setNewCardType] = useState<CardType>('CLASSIC')
  const [newCardFront, setNewCardFront] = useState('')
  const [newCardBack, setNewCardBack] = useState('')
  const [creating, setCreating] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)

  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

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
        setError(err instanceof ApiError ? err.message : 'Impossible de charger le deck')
      } finally {
        setCheckingAuth(false)
      }
    }

    void init(id)
  }, [id, navigate])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!id || !newCardFront.trim() || !newCardBack.trim()) return

    setCreating(true)
    setError(null)
    try {
      const card = await cardsApi.create(id, newCardType, newCardFront.trim(), newCardBack.trim())
      setCards((prev) => [card, ...prev])
      setNewCardFront('')
      setNewCardBack('')
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de créer la card')
    } finally {
      setCreating(false)
    }
  }

  async function handleTranslate() {
    if (!newCardFront.trim()) return

    setTranslating(true)
    setTranslateError(null)
    try {
      const { translation } = await translationApi.translate(newCardFront.trim(), 'EN')
      setNewCardBack(translation)
    } catch (err) {
      setTranslateError(err instanceof ApiError ? err.message : 'Traduction indisponible')
    } finally {
      setTranslating(false)
    }
  }

  function startEdit(card: Card) {
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
    setError(null)
    try {
      const updated = await cardsApi.update(cardId, editFront.trim(), editBack.trim())
      setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)))
      setEditingCardId(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de modifier la card')
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete(card: Card) {
    const confirmed = window.confirm('Supprimer cette card ? Cette action est irréversible.')
    if (!confirmed) return

    try {
      await cardsApi.remove(card.id)
      setCards((prev) => prev.filter((c) => c.id !== card.id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de supprimer la card')
    }
  }

  if (checkingAuth) {
    return <p>Chargement...</p>
  }

  return (
    <div>
      <p>
        <Link to="/decks">Retour aux decks</Link>
      </p>
      <h1>{deck?.name}</h1>

      {error && <p role="alert">{error}</p>}

      <p>
        <Link to={`/decks/${id}/review`}>Réviser</Link>
      </p>

      <button type="button" onClick={() => setShowCreateForm((v) => !v)}>
        {showCreateForm ? 'Annuler' : 'Ajouter une card'}
      </button>

      {showCreateForm && (
        <form onSubmit={handleCreate}>
          <div>
            <label>
              <input
                type="radio"
                name="cardType"
                value="CLASSIC"
                checked={newCardType === 'CLASSIC'}
                onChange={() => setNewCardType('CLASSIC')}
              />
              Rappel classique
            </label>
            <label>
              <input
                type="radio"
                name="cardType"
                value="OPEN_QUESTION"
                checked={newCardType === 'OPEN_QUESTION'}
                onChange={() => setNewCardType('OPEN_QUESTION')}
              />
              Question ouverte
            </label>
          </div>
          <div>
            <label htmlFor="front">{FIELD_LABELS[newCardType].front}</label>
            <input id="front" type="text" value={newCardFront} onChange={(e) => setNewCardFront(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="back">{FIELD_LABELS[newCardType].back}</label>
            <input id="back" type="text" value={newCardBack} onChange={(e) => setNewCardBack(e.target.value)} required />
            {newCardType === 'CLASSIC' && (
              <button type="button" disabled={translating || !newCardFront.trim()} onClick={handleTranslate}>
                {translating ? 'Traduction...' : 'Traduire'}
              </button>
            )}
            {translateError && <p role="alert">{translateError}</p>}
          </div>
          <button type="submit" disabled={creating}>
            {creating ? 'Création...' : 'Créer la card'}
          </button>
        </form>
      )}

      {cards.length === 0 ? (
        <p>Aucune card pour l'instant.</p>
      ) : (
        <ul>
          {cards.map((card) => (
            <li key={card.id}>
              {editingCardId === card.id ? (
                <div>
                  <div>
                    <label htmlFor={`edit-front-${card.id}`}>{FIELD_LABELS[card.type].front}</label>
                    <input
                      id={`edit-front-${card.id}`}
                      type="text"
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor={`edit-back-${card.id}`}>{FIELD_LABELS[card.type].back}</label>
                    <input
                      id={`edit-back-${card.id}`}
                      type="text"
                      value={editBack}
                      onChange={(e) => setEditBack(e.target.value)}
                    />
                  </div>
                  <button type="button" disabled={savingEdit} onClick={() => handleSaveEdit(card.id)}>
                    {savingEdit ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button type="button" onClick={cancelEdit}>
                    Annuler
                  </button>
                </div>
              ) : (
                <div>
                  <strong>[{card.type === 'CLASSIC' ? 'Rappel classique' : 'Question ouverte'}]</strong>{' '}
                  {card.front} / {card.back}
                  <button type="button" onClick={() => startEdit(card)}>
                    Éditer
                  </button>
                  <button type="button" onClick={() => handleDelete(card)}>
                    Supprimer
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DeckDetail
