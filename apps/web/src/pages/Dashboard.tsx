import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, dashboardApi, decksApi, ApiError } from '../services/api'
import type { DashboardSummary } from '../types/dashboard'
import type { Deck, DeckColor } from '../types/deck'
import { AppScreen } from '../design-system/components/AppScreen'
import { Lantern } from '../design-system/components/Lantern'
import { Scroll } from '../design-system/components/Scroll'
import { BrushLink } from '../design-system/components/BrushLink'
import { BrushStroke } from '../design-system/components/BrushStroke'
import { InkRule } from '../design-system/components/InkRule'
import { Label } from '../design-system/components/Label'
import { DeckRope } from '../design-system/components/DeckRope'
import { EmaPlaque, NewDeckPlaque } from '../design-system/components/EmaPlaque'
import { Notification } from '../design-system/components/Notification'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
import { deckThreadClass } from '../design-system/constants'
import { DeckFormModal } from './DeckFormModal'
import { deckTodayLabel, formatToday, plural, seasonOf, SEASON_LABELS, summarizeDay } from '../lib/today'
import type { DaySummary, Season } from '../lib/today'
import { frenchSpacing } from '../lib/typography'

// Couleur de l'accent de saison (point et libellé). Le libellé de l'été prend
// une teinte un peu plus foncée pour tenir le contraste AA en petit texte.
const SEASON_TEXT: Record<Season, string> = {
  spring: 'text-season-spring',
  summer: 'text-season-summer-ink',
  autumn: 'text-season-autumn',
  winter: 'text-season-winter',
}
const SEASON_DOT: Record<Season, string> = {
  spring: 'bg-season-spring',
  summer: 'bg-season-summer',
  autumn: 'bg-season-autumn',
  winter: 'bg-season-winter',
}

// Clé de la fermeture du cercle de la lanterne : jouée une fois par jour.
const LANTERN_CLOSE_KEY = 'palier-du-jour'

function lanternLabel(day: DaySummary): string {
  switch (day.state) {
    case 'active':
      return `Palier du jour : ${day.done} ${plural(day.done, 'carte', 'cartes')} sur ${day.target}`
    case 'closed':
      return `Palier du jour atteint : ${day.done} ${plural(day.done, 'carte', 'cartes')} sur ${day.target}`
    case 'clear':
      return 'Tout est à jour'
    case 'empty':
      return 'Aucun deck pour l’instant'
  }
}

function LanternCount({ done, target, accent }: { done: number; target: number; accent: boolean }) {
  return (
    <span className="flex flex-col items-center">
      <span className={`font-display text-display-lg ${accent ? 'text-vermillon' : 'text-ink'}`}>{done}</span>
      <span className="text-micro font-normal text-wood-ink-soft">sur {target}</span>
    </span>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [decks, setDecks] = useState<Deck[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creatingDeck, setCreatingDeck] = useState(false)
  const [savingDeck, setSavingDeck] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        await authApi.me()
      } catch {
        navigate('/login')
        return
      }

      const [summaryResult, decksResult] = await Promise.allSettled([dashboardApi.getSummary(), decksApi.list()])
      if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value)
      if (decksResult.status === 'fulfilled') setDecks(decksResult.value)
      const failure = [summaryResult, decksResult].find((r) => r.status === 'rejected')
      if (failure && failure.status === 'rejected') {
        setError(failure.reason instanceof ApiError ? failure.reason.message : 'Impossible de charger ton accueil')
      }
      setLoading(false)
    }

    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  async function handleCreateDeck(name: string, color: DeckColor | null) {
    setSavingDeck(true)
    try {
      await decksApi.create(name, color)
      // Relecture complète : le nouveau deck doit arriver avec son palier calculé.
      setDecks(await decksApi.list())
      setCreatingDeck(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création du deck impossible')
    } finally {
      setSavingDeck(false)
    }
  }

  if (loading) {
    return <PageSkeleton />
  }

  const today = new Date()
  const season = seasonOf(today)
  const day = summarizeDay(decks ?? [])
  const lanternValue = day.state === 'active' ? (day.target === 0 ? 0 : (day.done / day.target) * 100) : day.state === 'empty' ? 0 : 100

  return (
    <AppScreen>
      <header className="flex items-center justify-between gap-4">
        <h1 className="m-0 font-display text-display-lg">Constemps</h1>
        <div className="flex flex-col items-end">
          <span className="text-caption text-inksoft">{formatToday(today)}</span>
          <span className={`inline-flex items-center gap-2 text-caption font-bold ${SEASON_TEXT[season]}`}>
            <span aria-hidden="true" className={`size-2 rounded-full ${SEASON_DOT[season]}`} />
            {SEASON_LABELS[season]}
          </span>
        </div>
      </header>

      {error ? <Notification tone="danger" title="Chargement incomplet" message={error} /> : null}

      {/* Sans decks chargés, ni lanterne ni corde : un échec de chargement ne doit
          pas se faire passer pour « aucun deck ». */}
      {decks ? (
        <section aria-label="Aujourd'hui" className="flex items-start gap-6">
          <Lantern
            value={lanternValue}
            label={lanternLabel(day)}
            tone={day.state === 'closed' ? 'vermillon' : 'indigo'}
            closeKey={day.state === 'closed' ? LANTERN_CLOSE_KEY : undefined}
          >
            {day.state === 'active' || day.state === 'closed' ? (
              <LanternCount done={day.done} target={day.target} accent={day.state === 'closed'} />
            ) : null}
          </Lantern>
  
          <div className="flex-1 min-w-0 flex flex-col gap-1 pt-4">
            <Label>Aujourd'hui</Label>
            {day.state === 'active' ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-display text-hero text-indigo">{day.remaining}</span>
                  <span className="font-display text-body-lg leading-5">
                    {plural(day.remaining, 'carte', 'cartes')}
                    <br />
                    {plural(day.remaining, 't’attend', 't’attendent')}
                  </span>
                </div>
                {day.resumeDeck ? (
                  <BrushLink to={`/decks/${day.resumeDeck.id}/review`} delayMs={1600}>
                    Reprendre
                  </BrushLink>
                ) : null}
              </>
            ) : null}
            {day.state === 'closed' ? (
              <>
                <span className="font-display text-display-xl leading-9 text-indigo">
                  Journée
                  <br />
                  close
                </span>
                {day.continueDeck ? (
                  <BrushLink to={`/decks/${day.continueDeck.id}/review`} size="md" delayMs={1600}>
                    Continuer aujourd’hui
                  </BrushLink>
                ) : null}
              </>
            ) : null}
            {day.state === 'clear' ? <span className="font-display text-display-md text-indigo">Tout est à jour</span> : null}
            {day.state === 'empty' ? (
              <BrushLink onClick={() => setCreatingDeck(true)} size="md" delayMs={1600}>
                Crée ton premier deck
              </BrushLink>
            ) : null}
          </div>
        </section>
      ) : null}

      {summary ? (
        <Scroll label="Cette semaine">
          <div className="flex flex-col items-center">
            <Label>Cette semaine</Label>
            <BrushStroke tone="vermillon" className="w-24 h-2" delayMs={1200} />
          </div>
          <p className="m-0 font-display text-scroll text-balance">{frenchSpacing(summary.message)}</p>
          {summary.milestone ? (
            <>
              <InkRule />
              <p className="m-0 font-display text-body-lg text-balance">{frenchSpacing(summary.milestone.message)}</p>
            </>
          ) : null}
        </Scroll>
      ) : null}

      {decks ? (
        <section aria-labelledby="mes-decks" className="flex flex-col gap-2">
          <h2 id="mes-decks" className="m-0 font-display text-display-sm">
            Mes decks
          </h2>
          <DeckRope
            label="Mes decks, glisser pour voir la suite"
            items={[
              ...day.decks.map((d, i) => ({
                key: d.deck.id,
                threadClass: deckThreadClass(d.deck.color),
                node: (
                  <EmaPlaque
                    to={`/decks/${d.deck.id}`}
                    name={d.deck.name}
                    status={deckTodayLabel(d)}
                    progress={d.progress}
                    color={d.deck.color}
                    // Fermeture animée seulement si le deck a été travaillé aujourd'hui :
                    // un deck simplement à jour s'affiche fermé, sans animation.
                    closeKey={d.done > 0 ? `deck-${d.deck.id}` : undefined}
                    delayMs={600 + i * 150}
                  />
                ),
              })),
              { key: 'nouveau-deck', still: true, node: <NewDeckPlaque onClick={() => setCreatingDeck(true)} /> },
            ]}
          />
        </section>
      ) : null}

      {creatingDeck ? <DeckFormModal saving={savingDeck} onClose={() => setCreatingDeck(false)} onSubmit={handleCreateDeck} /> : null}
    </AppScreen>
  )
}

export default Dashboard
