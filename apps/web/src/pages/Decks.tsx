import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi, decksApi, ApiError } from '../services/api'
import type { Deck, DeckColor } from '../types/deck'
import { AppScreen } from '../design-system/components/AppScreen'
import { DeckRope } from '../design-system/components/DeckRope'
import { EmaPlaque, NewDeckPlaque } from '../design-system/components/EmaPlaque'
import { Notification } from '../design-system/components/Notification'
import { ToastViewport } from '../design-system/components/ToastViewport'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
import { useToast } from '../design-system/useToast'
import type { ToastState } from '../design-system/useToast'
import { decksSummaryLabel, deckTodayLabel, plural, summarizeDay } from '../lib/today'
import { deckKnotClass, deckThreadClass } from '../design-system/constants'
import { DeckFormModal } from './DeckFormModal'

// Mes decks (CON-69, S14-decks) : toutes les plaquettes sur des cordes empilées,
// comptées comme sur l'accueil. La modification et la suppression d'un deck se
// font depuis son intérieur.
function Decks() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [decks, setDecks] = useState<Deck[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creatingDeck, setCreatingDeck] = useState(false)
  const [savingDeck, setSavingDeck] = useState(false)
  const { toast, notify } = useToast()

  // Message laissé par l'écran précédent (deck supprimé, deck introuvable).
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
        await authApi.me()
      } catch {
        navigate('/login')
        return
      }

      try {
        setDecks(await decksApi.list())
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Impossible de charger tes decks')
      } finally {
        setLoading(false)
      }
    }

    void init()
  }, [navigate])

  async function handleCreateDeck(name: string, color: DeckColor | null) {
    setSavingDeck(true)
    try {
      await decksApi.create(name, color)
      // Relecture complète : le nouveau deck doit arriver avec son palier calculé.
      setDecks(await decksApi.list())
      setCreatingDeck(false)
    } catch (err) {
      notify({ tone: 'danger', title: 'Création impossible', message: err instanceof ApiError ? err.message : 'Une erreur est survenue' })
    } finally {
      setSavingDeck(false)
    }
  }

  if (loading) {
    return <PageSkeleton />
  }

  const day = summarizeDay(decks ?? [])

  return (
    <AppScreen>
      <ToastViewport toast={toast} />

      <header className="flex flex-col gap-1">
        <h1 className="m-0 font-display text-display-lg">Mes decks</h1>
        {decks ? <p className="m-0 text-body-sm text-inksoft">{decksSummaryLabel(day)}</p> : null}
      </header>

      {error ? <Notification tone="danger" title="Chargement impossible" message={error} /> : null}

      {/* Sans decks chargés, pas de corde : un échec ne doit pas passer pour « aucun deck ». */}
      {decks ? (
        <DeckRope
          stacked
          label="Mes decks"
          items={[
            ...day.decks.map((d, i) => {
              const cards = d.deck.cardCount ?? 0
              return {
                key: d.deck.id,
                threadClass: deckThreadClass(d.deck.color),
                knotClass: d.deck.isFavorite ? deckKnotClass(d.deck.color) : undefined,
                node: (
                  <EmaPlaque
                    to={`/decks/${d.deck.id}`}
                    name={d.deck.name}
                    status={deckTodayLabel(d)}
                    progress={d.progress}
                    color={d.deck.color}
                    total={cards === 0 ? 'Aucune carte' : `${cards} ${plural(cards, 'carte', 'cartes')}`}
                    // Même clé que l'accueil : la fermeture ne se joue qu'une fois par jour.
                    closeKey={d.done > 0 ? `deck-${d.deck.id}` : undefined}
                    delayMs={300 + i * 150}
                    favorite={d.deck.isFavorite}
                  />
                ),
              }
            }),
            { key: 'nouveau-deck', still: true, node: <NewDeckPlaque onClick={() => setCreatingDeck(true)} /> },
          ]}
        />
      ) : null}

      {creatingDeck ? <DeckFormModal saving={savingDeck} onClose={() => setCreatingDeck(false)} onSubmit={handleCreateDeck} /> : null}
    </AppScreen>
  )
}

export default Decks
