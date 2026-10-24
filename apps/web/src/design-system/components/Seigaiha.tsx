import { useId } from 'react'

// Fond de vagues seigaiha (CON-57) : bande en bas d'écran, qui apparaît en
// fondu et dérive lentement. rise (0 à 1) fait monter la marée avec la
// progression du palier en révision (CON-72, V7-revision). À poser dans un parent en position relative.
// Le rectangle dépasse de 20 % pour que la dérive de 40px (une période du
// motif) ne découvre jamais de bord vide.
export function Seigaiha({ rise }: { rise?: number } = {}) {
  // useId peut contenir des caractères spéciaux selon la version de React :
  // on ne garde que ceux qui sont sûrs dans une référence url(#...).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const patternId = `seigaiha-${uid}`
  const fadeId = `seigaiha-fade-${uid}`
  const maskId = `seigaiha-mask-${uid}`
  const scaleOrigins = [
    [0, 0],
    [40, 0],
    [20, 10],
    [0, 20],
    [40, 20],
  ]

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-seigaiha lg:h-seigaiha-wide overflow-hidden"
      style={rise === undefined ? undefined : { height: `calc(var(--seigaiha-base) + ${Math.round(Math.min(1, Math.max(0, rise)) * 190)}px)`, transition: 'height 1.4s cubic-bezier(0.3, 0.7, 0.2, 1)' }}
    >
      <defs>
        <pattern id={patternId} width="40" height="20" patternUnits="userSpaceOnUse">
          <g className="fill-seigaiha stroke-seigaiha-line" strokeWidth="1.2">
            {scaleOrigins.map(([x, y]) => (
              <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
                <circle r="20" />
                <circle r="15" />
                <circle r="10" />
                <circle r="5" />
              </g>
            ))}
          </g>
        </pattern>
        <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.51" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.85" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={maskId} maskContentUnits="objectBoundingBox">
          <rect width="1" height="1" fill={`url(#${fadeId})`} />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <g className="animate-drift">
          <rect width="120%" height="100%" fill={`url(#${patternId})`} />
        </g>
      </g>
    </svg>
  )
}
