import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, decksApi, ApiError } from '../services/api'
import type { Deck } from '../types/deck'
import { AppHeader } from '../design-system/components/AppHeader'
import { Card } from '../design-system/components/Card'
import { Button } from '../design-system/components/Button'
import { IconCircleButton } from '../design-system/components/IconCircleButton'
import { Input } from '../design-system/components/Input'
import { ConfirmModal } from '../design-system/components/Modal'
import { ToastViewport } from '../design-system/components/ToastViewport'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
import { useToast } from '../design-system/useToast'

function Decks() {
  const navigate = useNavigate()
  const [decks, setDecks] = useState<Deck[]>([])
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [newDeckName, setNewDeckName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null)
  const { toast, notify } = useToast()

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
        notify({ tone: 'danger', title: 'Chargement impossible', message: err instanceof ApiError ? err.message : 'Impossible de charger les decks' })
      } finally {
        setCheckingAuth(false)
      }
    }

    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!newDeckName.trim()) return

    setCreating(true)
    try {
      const deck = await decksApi.create(newDeckName.trim())
      setDecks((prev) => [deck, ...prev])
      setNewDeckName('')
    } catch (err) {
      notify({ tone: 'danger', title: 'Création impossible', message: err instanceof ApiError ? err.message : 'Impossible de créer le deck' })
    } finally {
      setCreating(false)
    }
  }

  async function confirmDelete() {
    if (!deckToDelete) return
    const deck = deckToDelete
    setDeckToDelete(null)

    try {
      await decksApi.remove(deck.id)
      setDecks((prev) => prev.filter((d) => d.id !== deck.id))
      notify({ tone: 'success', title: 'Deck supprimé', message: `"${deck.name}" a été supprimé.` })
    } catch (err) {
      notify({ tone: 'danger', title: 'Suppression impossible', message: err instanceof ApiError ? err.message : 'Impossible de supprimer le deck' })
    }
  }

  async function handleLogout() {
    await authApi.logout()
    navigate('/login')
  }

  if (checkingAuth) {
    return <PageSkeleton />
  }

  return (
    <div className="wrap">
      <ToastViewport toast={toast} />

      <AppHeader
        actions={
          <Button variant="ghost" icon="ph:sign-out-bold" onClick={handleLogout}>
            Se déconnecter
          </Button>
        }
      />

      <h1 style={{ font: 'var(--text-display-lg)', color: 'var(--ink)', letterSpacing: 'var(--tracking-tight)', margin: '0 0 20px' }}>
        Mes decks
      </h1>

      <Card style={{ padding: 20, marginBottom: 24 }}>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Input placeholder="Nom du deck" value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} required style={{ flex: 1 }} />
          <Button type="submit" disabled={creating} icon="ph:plus-bold">
            {creating ? 'Création...' : 'Créer un deck'}
          </Button>
        </form>
      </Card>

      {decks.length === 0 ? (
        <p style={{ font: 'var(--text-body-md)', color: 'var(--inksoft)' }}>Aucun deck pour l'instant.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {decks.map((deck) => (
            <Card key={deck.id} interactive style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 100 }}>
              <Link
                to={`/decks/${deck.id}`}
                style={{ font: 'var(--text-display-sm)', color: 'var(--ink)', letterSpacing: 'var(--tracking-tight)' }}
              >
                {deck.name}
              </Link>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                <IconCircleButton icon="ph:trash-bold" tone="ghost" size={32} title="Supprimer" onClick={() => setDeckToDelete(deck)} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {deckToDelete && (
        <ConfirmModal
          title="Supprimer ce deck ?"
          confirmLabel="Supprimer"
          confirmVariant="danger"
          onConfirm={confirmDelete}
          onClose={() => setDeckToDelete(null)}
        >
          Le deck "{deckToDelete.name}" et toutes ses cards seront supprimés définitivement. Cette action est irréversible.
        </ConfirmModal>
      )}
    </div>
  )
}

export default Decks
