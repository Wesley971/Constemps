import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import brushUrl from '../../assets/brush-circle.svg'

type BrushCircleSize = 'sm' | 'deck' | 'review' | 'stamp' | 'md' | 'lg'
type BrushCircleTone = 'indigo' | 'vermillon' | 'cream'

interface BrushCircleProps {
  // Progression de 0 à 100. À 100, le cercle est fermé.
  value: number
  // Libellé lu par les lecteurs d'écran, ex. « Palier du jour : 7 cartes sur 18 ».
  label: string
  size?: BrushCircleSize
  tone?: BrushCircleTone
  // Identifiant stable du cercle : sert à ne jouer la fermeture qu'une fois par
  // jour. Sans identifiant, un cercle complet s'affiche fermé, sans animation.
  closeKey?: string
  // Fermeture jouée à chaque affichage, sans mémoire du jour (cercle de l'écran
  // de connexion, CON-71). Prime sur closeKey.
  playClose?: boolean
  // Délai avant le tracé, pour échelonner plusieurs cercles à l'ouverture.
  delayMs?: number
  children?: ReactNode
}

const sizes: Record<BrushCircleSize, string> = {
  sm: 'size-8',
  // Grande plaquette de l'intérieur d'un deck (S15-deck).
  deck: 'size-11',
  // Palier dans le rideau de la révision, et cercle du tampon « Journée close » (V7-revision).
  review: 'size-16',
  stamp: 'size-26',
  md: 'size-20',
  lg: 'size-23',
}

const tones: Record<BrushCircleTone, string> = {
  indigo: 'text-indigo',
  vermillon: 'text-vermillon',
  cream: 'text-cream',
}

// Angle de masque correspondant à une progression, relevé sur les planches
// (20 % → 63deg ... 100 % → 295deg, la seconde couche fermant le reste).
const ANGLE_POINTS: [number, number][] = [
  [0, 0],
  [20, 63],
  [39, 116],
  [60, 175],
  [80, 231],
  [100, 295],
]

function angleFor(value: number): number {
  const v = Math.min(100, Math.max(0, value))
  for (let i = 1; i < ANGLE_POINTS.length; i++) {
    const [p1, a1] = ANGLE_POINTS[i]
    if (v <= p1) {
      const [p0, a0] = ANGLE_POINTS[i - 1]
      return a0 + ((v - p0) / (p1 - p0)) * (a1 - a0)
    }
  }
  return 295
}

// La seconde couche referme le cercle quand le tracé arrive en fin de course.
const GAP_DELAY_MS = 1450

const STORAGE_PREFIX = 'constemps.brushClosed.'

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Stockage protégé : navigation privée ou stockage bloqué ne doivent jamais
// casser l'affichage. En cas d'échec de lecture, la fermeture est rejouée.
function closePlayedToday(key: string): boolean {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key) === today()
  } catch {
    return false
  }
}

function rememberClosePlayed(key: string) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, today())
  } catch {
    // Rien à faire : au pire, la fermeture sera rejouée à la prochaine vue.
  }
}

function Stroke({ className, style }: { className: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 1000 1000" fill="currentColor" aria-hidden="true" className={`absolute inset-0 size-full ${className}`} style={style}>
      <use href={`${brushUrl}#brush`} />
    </svg>
  )
}

export function BrushCircle({ value, label, size = 'md', tone = 'indigo', closeKey, playClose, delayMs = 0, children }: BrushCircleProps) {
  const complete = value >= 100

  // Décision prise une seule fois à l'initialisation (et non dans l'effet) : en
  // développement, StrictMode rejoue les effets, et l'écriture faite au premier
  // passage empêcherait sinon l'animation au second.
  const [animateClose, setAnimateClose] = useState(() => complete && (playClose || (closeKey !== undefined && !closePlayedToday(closeKey))))

  useEffect(() => {
    if (!complete || playClose || closeKey === undefined) return
    if (animateClose) {
      rememberClosePlayed(closeKey)
    } else if (!closePlayedToday(closeKey)) {
      // Le cercle vient de se compléter sous les yeux de l'utilisateur.
      setAnimateClose(true)
    }
  }, [complete, closeKey, playClose, animateClose])

  const delay = { animationDelay: `${delayMs}ms` }

  return (
    <span role="img" aria-label={label} className={`relative inline-flex items-center justify-center shrink-0 ${sizes[size]} ${tones[tone]}`}>
      {complete ? (
        <>
          <Stroke className={`brush-stroke ${animateClose ? 'brush-close' : ''}`} style={{ '--a': '295deg', ...delay } as CSSProperties} />
          <Stroke className={`brush-gap ${animateClose ? 'brush-gap-close' : ''}`} style={{ animationDelay: `${delayMs + GAP_DELAY_MS}ms` }} />
        </>
      ) : (
        <>
          <Stroke className="brush-ghost" />
          <Stroke className="brush-stroke brush-draw" style={{ '--a': `${angleFor(value)}deg`, ...delay } as CSSProperties} />
        </>
      )}
      {children ? <span className="relative">{children}</span> : null}
    </span>
  )
}
