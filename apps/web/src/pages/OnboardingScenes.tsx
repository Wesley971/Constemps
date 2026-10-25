import type { CSSProperties } from 'react'
import { BrushCircle } from '../design-system/components/BrushCircle'
import { Lantern } from '../design-system/components/Lantern'

// Illustrations des trois gestes de l'onboarding (CON-56, S21-H-anime). Purement
// décoratives : la page les pose sous aria-hidden et inert. Dessinées ici plutôt
// que reprises des vrais composants quand ceux-ci sont des liens (plaquettes) ou
// trop grands pour la feuille (carte ronde, rouleau).

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` })

interface MiniPlaqueProps {
  name: string
  progress: number
  // Position sur la corde et longueur du fil, qui la fait toucher la corde.
  place: string
  thread: string
  swayDelayMs: number
  chosen?: boolean
}

function MiniPlaque({ name, progress, place, thread, swayDelayMs, chosen }: MiniPlaqueProps) {
  return (
    <span className={`absolute w-18 origin-top animate-sway ${place}`} style={delay(swayDelayMs)}>
      <span className={`flex flex-col items-center ${chosen ? 'plaque-lit' : 'drop-shadow-ema'}`}>
        <span className={`w-thread bg-vermillon ${thread}`} />
        <span className={`ema-shape w-18 h-22 pb-3 flex flex-col items-center justify-end gap-1 bg-wood ${chosen ? 'plaque-lift' : ''}`}>
          <BrushCircle value={progress} size="sm" label={name} delayMs={900} />
          <span className="font-display text-caption font-bold text-wood-ink">{name}</span>
        </span>
      </span>
    </span>
  )
}

// Geste 1, « Choisis un deck » : trois plaquettes qui se balancent sur leur corde,
// une main monte et touche celle du milieu, qui se soulève.
export function ChooseDeckScene() {
  return (
    <div className="relative w-62 h-35">
      <svg viewBox="0 0 248 32" fill="none" className="absolute left-0 top-0 w-62 h-8 overflow-visible">
        <path d="M-6 6 Q 124 30 254 6" className="stroke-rope" strokeWidth="2" />
      </svg>
      <MiniPlaque name="Verbes" progress={60} place="left-3 top-3" thread="h-5" swayDelayMs={0} />
      <MiniPlaque name="Voyage" progress={80} place="left-23 top-5" thread="h-3" swayDelayMs={-1500} chosen />
      <MiniPlaque name="Couleurs" progress={100} place="left-43 top-3" thread="h-5" swayDelayMs={-3000} />
      <svg viewBox="0 0 24 24" className="hand-tap absolute left-30 top-24 size-8">
        <path
          d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-.5V4a1.5 1.5 0 0 1 3 0v6m0-1a1.5 1.5 0 0 1 3 0v4.5c0 3.6-2.4 6.5-6 6.5h-1c-2.2 0-3.6-1-4.8-2.6L3.6 14a1.5 1.5 0 0 1 2.4-1.8L9 15"
          className="fill-paper-card stroke-indigo"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// Geste 2, « Révise un peu » : la carte apparaît, le rouleau se déroule avec la
// réponse, une note s'allume.
export function ReviewScene() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <span className="pop-in size-29 rounded-full bg-paper-card shadow-round-card flex items-center justify-center text-center font-display text-body-sm font-bold" style={delay(700)}>
          to come
          <br />
          across
        </span>
        <span className="flex flex-col items-center">
          <span className="w-24 h-2 rounded-xs bg-scroll-rail" />
          <span className="scroll-unroll w-21 px-1 flex bg-scroll-mount" style={delay(1500)}>
            <span className="flex-1 py-2 bg-paper font-display text-caption text-center">tomber sur</span>
          </span>
          <span className="w-25 h-2 rounded-xs bg-scroll-rail" />
        </span>
      </div>
      <div className="w-55 flex gap-1">
        <span className="flex-1 h-4 rounded-t-xs rounded-b-md bg-vermillon-tint" />
        <span className="flex-1 h-4 rounded-t-xs rounded-b-md bg-indigo-veil" />
        <span className="rating-pick flex-1 h-4 rounded-t-xs rounded-b-md bg-indigo-veil" />
        <span className="flex-1 h-4 rounded-t-xs rounded-b-md bg-indigo-veil" />
      </div>
    </div>
  )
}

// Geste 3, « Ferme le cercle » : la lanterne s'allume, le cercle vermillon se
// peint jusqu'à se fermer.
export function CloseCircleScene() {
  return (
    <Lantern value={100} label="12 sur 12" tone="vermillon" playClose lit>
      <span className="flex flex-col items-center">
        <span className="font-display text-display-lg text-vermillon">12</span>
        <span className="text-micro font-normal text-wood-ink-soft">sur 12</span>
      </span>
    </Lantern>
  )
}
