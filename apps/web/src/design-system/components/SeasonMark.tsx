import { useEffect, useId, useState } from 'react'
import { playedToday, rememberPlayedToday } from '../../lib/dailyOnce'
import { SEASON_LABELS } from '../../lib/today'
import type { Season } from '../../lib/today'

// Une seule clé pour toutes les saisons, l'accueil mobile et le rail : l'icône ne
// s'anime qu'à la première ouverture du jour, où qu'elle apparaisse.
const STORAGE_KEY = 'constemps.seasonPlayed'

// Nom écrit dans la couleur de son icône, assombrie au besoin (voir tokens.css).
const SEASON_TEXT: Record<Season, string> = {
  spring: 'text-season-spring-ink',
  summer: 'text-season-summer-ink',
  autumn: 'text-season-autumn',
  winter: 'text-season-winter',
}

// Pétale échancré du cerisier, répété cinq fois autour du centre.
const PETAL = 'M12 12C7.8 9 7.4 4.2 10.4 2.6L12 4.5l1.6-1.9C16.6 4.2 16.2 9 12 12Z'

// Tracé de la feuille d'érable japonais à sept lobes (S22-saisons).
const MAPLE =
  'M12.00 15.40 L10.85 15.56 L9.68 14.42 L8.47 14.97 L8.52 14.66 L7.15 15.20 L8.31 14.28 L8.01 14.18 L9.09 13.40 L7.84 12.95 L7.28 12.07 L5.37 11.35 L5.78 11.08 L3.69 10.17 L5.95 10.43 L5.74 10.00 L7.75 10.33 L8.54 10.02 L7.90 8.57 L6.68 6.49 L7.25 6.53 L6.00 4.15 L7.89 6.07 L8.02 5.51 L9.63 7.32 L10.70 8.41 L10.85 6.46 L11.10 3.87 L11.57 4.27 L12.00 1.40 L12.43 4.27 L12.90 3.87 L13.15 6.46 L13.30 8.41 L14.37 7.32 L15.98 5.51 L16.11 6.07 L18.00 4.15 L16.75 6.53 L17.32 6.49 L16.10 8.57 L15.46 10.02 L16.25 10.33 L18.26 10.00 L18.05 10.43 L20.31 10.17 L18.22 11.08 L18.63 11.35 L16.72 12.07 L16.16 12.95 L14.91 13.40 L15.99 14.18 L15.69 14.28 L16.85 15.20 L15.48 14.66 L15.53 14.97 L14.32 14.42 L13.15 15.56Z'

function SeasonIcon({ season, animate }: { season: Season; animate: boolean }) {
  const seaId = useId()
  const play = (name: string) => (animate ? name : undefined)

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="absolute left-0 top-1/2 -translate-y-1/2 size-5">
      {season === 'spring' ? (
        <>
          <g className={play('season-bloom')}>
            <g className="fill-season-spring">
              {[0, 72, 144, 216, 288].map((angle) => (
                <path key={angle} transform={`rotate(${angle} 12 12)`} d={PETAL} />
              ))}
            </g>
            <circle cx="12" cy="12" r="1.8" className="fill-season-spring-heart" />
            <path d="M12 12V8.8M12 12l3-1M12 12l1.9 2.7M12 12l-1.9 2.7M12 12l-3-1" className="stroke-season-spring-heart" strokeWidth=".6" strokeLinecap="round" />
          </g>
          <path className={`fill-season-spring ${play('season-petal') ?? ''}`} d="M19 4c1.3-.3 2.3.5 2.2 1.6-.9.6-2.1.4-2.6-.4l.4-1.2z" />
        </>
      ) : null}
      {season === 'summer' ? (
        <>
          <defs>
            <clipPath id={seaId}>
              <rect width="24" height="16.2" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${seaId})`}>
            <g className={play('season-sunrise')}>
              <path className={`stroke-season-summer ${play('season-rays') ?? ''}`} strokeWidth="1.6" strokeLinecap="round" d="M12 1.8v2.4M5 4.8l1.6 1.6M19 4.8l-1.6 1.6M2.6 11.5h2.3M19.1 11.5h2.3" />
              <circle cx="12" cy="11.5" r="4.6" className="fill-season-summer" />
            </g>
          </g>
          <g fill="none" strokeLinecap="round" className="stroke-season-sea">
            <path strokeWidth="1.5" d="M2 18.2c1.6-1.6 3.4-1.6 5 0 1.6-1.6 3.4-1.6 5 0 1.6-1.6 3.4-1.6 5 0 1.6-1.6 3.4-1.6 5 0" />
            <path strokeWidth="1.3" strokeOpacity=".5" d="M4.5 21.4c1.6-1.6 3.4-1.6 5 0 1.6-1.6 3.4-1.6 5 0 1.6-1.6 3.4-1.6 5 0" />
          </g>
        </>
      ) : null}
      {season === 'autumn' ? (
        <g className={play('season-fall')}>
          <path d={MAPLE} className="fill-season-autumn stroke-season-autumn" strokeWidth=".5" strokeLinejoin="round" />
          <path d="M12 15.2q.2 2.8 1.4 5.2" fill="none" className="stroke-season-autumn" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      ) : null}
      {season === 'winter' ? (
        <g className={`stroke-season-winter ${play('season-snow') ?? ''}`} fill="none" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
          <path d="M10 4.5l2 1.8 2-1.8M10 19.5l2-1.8 2 1.8M5.2 10.4l2.6-.6-.8-2.6M18.8 13.6l-2.6.6.8 2.6M5.2 13.6l2.6.6-.8 2.6M18.8 10.4l-2.6-.6.8-2.6" />
        </g>
      ) : null}
    </svg>
  )
}

// Saison sous la date (CON-80, S22-saisons) : petite icône et nom de la saison.
// Dans le rail, la poser sous [data-surface='noren'] pour ses couleurs claires.
export function SeasonMark({ season }: { season: Season }) {
  // Décision prise une seule fois à l'initialisation, comme BrushCircle : en
  // développement, StrictMode rejoue les effets, et l'écriture faite au premier
  // passage couperait sinon l'animation au second.
  const [animate] = useState(() => !playedToday(STORAGE_KEY))

  useEffect(() => {
    if (animate) rememberPlayedToday(STORAGE_KEY)
  }, [animate])

  return (
    <span className={`inline-flex items-center gap-2 text-caption font-bold ${SEASON_TEXT[season]}`}>
      {/* L'icône de 20 px déborde de la ligne de 16 px sans la grandir : l'en-tête
          de l'accueil garde sa hauteur (date et saison, comme le titre). */}
      <span className="relative w-5 h-4 shrink-0">
        <SeasonIcon season={season} animate={animate} />
      </span>
      {SEASON_LABELS[season]}
    </span>
  )
}
