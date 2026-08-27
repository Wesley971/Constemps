import { useEffect, useState } from 'react'

interface GoalRingProps {
  closed: boolean
  size?: number
}

const STROKE_WIDTH = 2.5

// Anneau qui se referme autour de l'icône du deck au palier atteint (CON-36).
// La transition n'est activée qu'après le premier paint : si le palier est
// déjà atteint au chargement de la page, l'anneau apparaît directement fermé,
// sans rejouer l'animation d'ouverture -> fermeture.
export function GoalRing({ closed, size = 30 }: GoalRingProps) {
  const [transitionReady, setTransitionReady] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setTransitionReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const radius = (size - STROKE_WIDTH) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 -rotate-90 pointer-events-none"
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={closed ? 0 : circumference}
        className={`text-clay ${transitionReady ? 'transition-[stroke-dashoffset] duration-slow ease-standard' : ''}`}
      />
    </svg>
  )
}
