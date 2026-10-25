import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppScreen } from '../design-system/components/AppScreen'
import { BrushStroke } from '../design-system/components/BrushStroke'
import { Button } from '../design-system/components/Button'
import { Label } from '../design-system/components/Label'
import { ChooseDeckScene, CloseCircleScene, ReviewScene } from './OnboardingScenes'

// État de navigation posé par l'inscription : seule porte d'entrée de l'onboarding.
export interface WelcomeState {
  welcome: true
  firstName: string | null
}

// État posé sur l'accueil par « Créer mon premier deck » : ouvre le rideau de création.
export interface CreateDeckState {
  createDeck: true
}

function readWelcome(state: unknown): WelcomeState | null {
  if (typeof state !== 'object' || state === null || !('welcome' in state)) return null
  const firstName = (state as { firstName?: unknown }).firstName
  return { welcome: true, firstName: typeof firstName === 'string' && firstName !== '' ? firstName : null }
}

const GESTURES: { title: string; text: string; scene: ReactNode }[] = [
  {
    title: 'Choisis un deck',
    text: 'Une plaquette par sujet. Crée la tienne, ou génère des cartes depuis un texte.',
    scene: <ChooseDeckScene />,
  },
  {
    title: 'Révise un peu',
    text: 'Quelques cartes par jour. Tu te notes, ou l’IA lit ta réponse.',
    scene: <ReviewScene />,
  },
  {
    title: 'Ferme le cercle',
    text: 'Quand le palier du jour est atteint, le cercle se ferme. Tu peux t’arrêter.',
    scene: <CloseCircleScene />,
  },
]

const LAST = GESTURES.length - 1
// Centres des cercles du fil, dans le viewBox de 280 × 32.
const THREAD_X = [20, 140, 260]

function gestureStatus(index: number, step: number): string {
  if (index < step) return 'fait'
  return index === step ? 'en cours' : 'à venir'
}

// Fil qui relie les trois gestes : le trait se trace jusqu'au geste courant. Les
// gestes passés sont pleins, le courant cerclé de vermillon. Décoratif : la liste
// cachée qui le suit le dit en texte.
function GestureThread({ step, forward }: { step: number; forward: boolean }) {
  const doneEnd = THREAD_X[forward ? step - 1 : step] ?? THREAD_X[0]
  return (
    <svg viewBox="0 0 280 32" fill="none" aria-hidden="true" className="block w-70 h-8">
      <path d="M20 16 H260" className="stroke-rope/35" strokeWidth="2" strokeDasharray="4 5" />
      {doneEnd > THREAD_X[0] ? <path d={`M20 16 H${doneEnd}`} className="stroke-rope" strokeWidth="2.4" /> : null}
      {forward && step > 0 ? (
        <path key={step} d={`M${THREAD_X[step - 1]} 16 H${THREAD_X[step]}`} pathLength={1} className="thread-draw stroke-rope" strokeWidth="2.4" />
      ) : null}
      {THREAD_X.map((x, i) => {
        if (i < step) {
          return (
            <g key={i}>
              <circle cx={x} cy="16" r="11" className="fill-indigo" />
              <text x={x} y="20.5" textAnchor="middle" className="fill-on-indigo font-display text-caption font-bold">
                {i + 1}
              </text>
            </g>
          )
        }
        if (i === step) {
          return (
            <g key={`${i}-${step}`} className="pop-in" style={{ animationDelay: forward && step > 0 ? '1s' : '0.2s' }}>
              <circle cx={x} cy="16" r="13" strokeWidth="2" className="fill-canvas stroke-vermillon" />
              <text x={x} y="20.5" textAnchor="middle" className="fill-vermillon font-display text-label font-bold">
                {i + 1}
              </text>
            </g>
          )
        }
        return (
          <g key={i}>
            <circle cx={x} cy="16" r="11" strokeWidth="1.5" className="fill-canvas stroke-indigo/35" />
            <text x={x} y="20.5" textAnchor="middle" className="fill-inksoft font-display text-caption font-bold">
              {i + 1}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// Onboarding « trois gestes » (CON-56, S21-H1, S21-H3, S21-H-anime) : une seule
// fois, juste après l'inscription, ouvert par l'état de navigation de Register.
// Rien n'est gardé en base : sans cet état (rechargement, adresse tapée, retour
// arrière), la page renvoie à l'accueil.
function Onboarding() {
  const location = useLocation()
  const navigate = useNavigate()
  // Lu une seule fois, à l'initialisation : l'effet ci-dessous efface l'état, et
  // StrictMode le rejoue en développement.
  const [welcome] = useState(() => readWelcome(location.state))
  const [step, setStep] = useState(0)
  const [forward, setForward] = useState(true)
  const [announcement, setAnnouncement] = useState('')
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!welcome) return
    // Un rechargement de /bienvenue ne rejoue pas l'onboarding.
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcome])

  // À chaque geste : focus sur son titre, et annonce « Geste N sur 3 » dans une
  // région toujours montée (une région montée avec son texte n'est pas lue).
  useEffect(() => {
    if (!welcome) return
    titleRef.current?.focus()
    setAnnouncement(`Geste ${step + 1} sur ${GESTURES.length}`)
  }, [step, welcome])

  if (!welcome) return <Navigate to="/dashboard" replace />

  const gesture = GESTURES[step]

  function go(next: number) {
    setForward(next > step)
    setStep(next)
  }

  function skip() {
    navigate('/dashboard', { replace: true })
  }

  function createFirstDeck() {
    const state: CreateDeckState = { createDeck: true }
    navigate('/dashboard', { replace: true, state })
  }

  return (
    <AppScreen tallNoren withTabs={false} wideNoren>
      <p role="status" className="sr-only">
        {announcement}
      </p>

      {/* Colonne centrée, comme le formulaire de connexion sur grand écran. */}
      <div className="flex-1 w-full max-w-96 self-center flex flex-col items-center gap-4 lg:flex-none lg:my-auto">
        {/* Petit « Passer » discret en haut, aux gestes 2 et 3 ; sa ligne est
            toujours réservée, pour que rien ne bouge d'un geste à l'autre. */}
        <div className="self-stretch h-hit -mb-4 flex justify-end">
          {step > 0 ? (
            <button type="button" onClick={skip} className="h-hit px-2 bg-transparent border-none cursor-pointer font-body text-body-sm font-bold text-inksoft">
              Passer
            </button>
          ) : null}
        </div>

        <div className="flex flex-col items-center text-center">
          <h1 className="m-0 font-display text-display-lg text-balance">{welcome.firstName ? `Bienvenue, ${welcome.firstName}` : 'Bienvenue'}</h1>
          <BrushStroke tone="vermillon" className="w-34 h-2" delayMs={600} />
          <p className="m-0 mt-1 font-display text-body-md text-inksoft">Constemps tient en trois gestes.</p>
        </div>

        <GestureThread step={step} forward={forward} />
        <ol className="sr-only">
          {GESTURES.map((g, i) => (
            <li key={g.title}>
              Geste {i + 1}, {gestureStatus(i, step)}
            </li>
          ))}
        </ol>

        {/* Cadre en bois et feuille : objets clairs, encre du jour dans les deux thèmes. */}
        <div data-surface="paper" className="relative w-84 p-3 rounded-sm bg-rope shadow-frame">
          <span aria-hidden="true" className="absolute -left-2 top-3 bottom-3 w-2 rounded-l-xs bg-frame-edge" />
          <span aria-hidden="true" className="absolute -right-2 top-3 bottom-3 w-2 rounded-r-xs bg-frame-edge" />
          <div className="relative h-84 overflow-hidden bg-frame-well">
            <section
              key={step}
              aria-labelledby="geste-titre"
              className={`absolute inset-0 px-4 py-4 flex flex-col items-center justify-center gap-3 bg-paper text-center ${
                forward ? 'sheet-in shadow-sheet' : 'sheet-in-back shadow-sheet-back'
              }`}
            >
              <Label>
                Geste {step + 1} sur {GESTURES.length}
              </Label>
              <div aria-hidden="true" inert>
                {gesture.scene}
              </div>
              <h2 id="geste-titre" ref={titleRef} tabIndex={-1} className="text-rise m-0 font-display text-display-md focus:outline-none">
                {gesture.title}
              </h2>
              <p className="text-rise m-0 text-body-sm text-inksoft text-balance" style={{ animationDelay: '1.1s' }}>
                {gesture.text}
              </p>
            </section>
          </div>
        </div>

        <div className="mt-auto self-stretch flex items-center gap-3 lg:mt-4">
          {step === 0 ? (
            <button type="button" onClick={skip} className="h-hit px-2 bg-transparent border-none cursor-pointer font-body text-body-sm font-bold text-inksoft">
              Passer
            </button>
          ) : (
            <button type="button" onClick={() => go(step - 1)} className="h-hit px-2 bg-transparent border-none cursor-pointer font-body text-body-sm font-bold text-inksoft">
              Retour
            </button>
          )}
          {step < LAST ? (
            <Button onClick={() => go(step + 1)} className="flex-1">
              Geste suivant
            </Button>
          ) : (
            <Button onClick={createFirstDeck} className="flex-1">
              Créer mon premier deck
            </Button>
          )}
        </div>
      </div>
    </AppScreen>
  )
}

export default Onboarding
