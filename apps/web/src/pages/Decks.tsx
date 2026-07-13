import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, decksApi, ApiError } from '../services/api'
import type { Deck } from '../types/deck'

function Decks() {
  const navigate = useNavigate()
  const [decks, setDecks] = useState<Deck[]>([])
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [newDeckName, setNewDeckName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        await authApi.me()
      } catch {
        navigate('/login')
        return
      }

      try {
        const data = await decksApi.list()
        setDecks(data)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Impossible de charger les decks')
      } finally {
        setCheckingAuth(false)
      }
    }

    void init()
  }, [navigate])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!newDeckName.trim()) return

    setCreating(true)
    setError(null)
    try {
      const deck = await decksApi.create(newDeckName.trim())
      setDecks((prev) => [deck, ...prev])
      setNewDeckName('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de créer le deck')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(deck: Deck) {
    const confirmed = window.confirm(`Supprimer le deck "${deck.name}" ? Cette action est irréversible.`)
    if (!confirmed) return

    try {
      await decksApi.remove(deck.id)
      setDecks((prev) => prev.filter((d) => d.id !== deck.id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de supprimer le deck')
    }
  }

  async function handleLogout() {
    await authApi.logout()
    navigate('/login')
  }

  if (checkingAuth) {
    return <p>Chargement...</p>
  }

  return (
    <div>
      <h1>Mes decks</h1>
      <button type="button" onClick={handleLogout}>
        Se déconnecter
      </button>

      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Nom du deck"
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          required
        />
        <button type="submit" disabled={creating}>
          {creating ? 'Création...' : 'Créer un deck'}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {decks.length === 0 ? (
        <p>Aucun deck pour l'instant.</p>
      ) : (
        <ul>
          {decks.map((deck) => (
            <li key={deck.id}>
              {deck.name}
              <button type="button" onClick={() => handleDelete(deck)}>
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Decks
