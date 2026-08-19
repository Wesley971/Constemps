import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi, decksApi, ApiError } from '../services/api'
import type { Deck, DeckColor, DeckIcon } from '../types/deck'
import type { User } from '../types/user'
import { AppHeader } from '../design-system/components/AppHeader'
import { Button } from '../design-system/components/Button'
import { DeckCard } from '../design-system/components/DeckCard'
import { ConfirmModal } from '../design-system/components/Modal'
import { ToastViewport } from '../design-system/components/ToastViewport'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
import { useToast } from '../design-system/useToast'
import type { ToastState } from '../design-system/useToast'
import { DeckFormModal } from './DeckFormModal'

type FormModalState = { mode: 'create' } | { mode: 'edit'; deck: Deck } | null

function Decks() {
  const navigate = useNavigate()
  const location = useLocation()
  const [decks, setDecks] = useState<Deck[]>([])
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [formModal, setFormModal] = useState<FormModalState>(null)
  const [saving, setSaving] = useState(false)
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null)
  const { toast, notify } = useToast()

  useEffect(() => {
    const state = location.state as { notify?: ToastState } | null
    if (state?.notify) {
      notify(state.notify)
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function init() {
      try {
        setUser(await authApi.me())
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

  async function handleSubmitDeck(name: string, color: DeckColor | null, icon: DeckIcon | null) {
    const editing = formModal?.mode === 'edit' ? formModal.deck : null
    setSaving(true)
    try {
      if (editing) {
        const updated = await decksApi.update(editing.id, name, color, icon)
        setDecks((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)))
      } else {
        const deck = await decksApi.create(name, color, icon)
        setDecks((prev) => [deck, ...prev])
      }
      setFormModal(null)
    } catch (err) {
      notify({
        tone: 'danger',
        title: editing ? 'Modification impossible' : 'Création impossible',
        message: err instanceof ApiError ? err.message : 'Une erreur est survenue',
      })
    } finally {
      setSaving(false)
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
    <div className="max-w-wrap mx-auto">
      <ToastViewport toast={toast} />

      <AppHeader
        email={user?.email}
        actions={
          <Button variant="ghost" icon="ph:sign-out-bold" onClick={handleLogout}>
            Se déconnecter
          </Button>
        }
      />

      <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
        <h1 className="font-display text-display-lg text-ink tracking-tight m-0">Mes decks</h1>
        <Button icon="ph:plus-bold" onClick={() => setFormModal({ mode: 'create' })}>
          Créer un deck
        </Button>
      </div>

      {decks.length === 0 ? (
        <p className="font-body text-body-md text-inksoft">Aucun deck pour l'instant.</p>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              name={deck.name}
              cardCount={deck.cardCount ?? 0}
              to={`/decks/${deck.id}`}
              color={deck.color}
              icon={deck.icon}
              onEdit={() => setFormModal({ mode: 'edit', deck })}
              onDelete={() => setDeckToDelete(deck)}
            />
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

      {formModal && (
        <DeckFormModal
          deck={formModal.mode === 'edit' ? formModal.deck : null}
          saving={saving}
          onClose={() => setFormModal(null)}
          onSubmit={handleSubmitDeck}
        />
      )}
    </div>
  )
}

export default Decks
