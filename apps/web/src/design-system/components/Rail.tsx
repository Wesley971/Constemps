import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { TABS } from '../constants'
import { formatToday, seasonOf } from '../../lib/today'
import { SeasonMark } from './SeasonMark'

// Rail des grands écrans (CON-75, S20-C) : rouleau d'étoffe suspendu à gauche,
// avec le nom de l'app, la date, les onglets et la devise. Remplace la barre
// d'onglets dès 1024px ; fixe pendant le défilement. Étoffe et barre suivent les
// tokens noren et scroll-cap, comme les rideaux, dans les deux thèmes.
// L'onglet actif est une languette couleur du fond, qui rejoint la page.
// Saison sous la date (CON-80), en couleurs claires sur l'étoffe et cachée aux
// lecteurs d'écran : l'en-tête caché de l'accueil l'annonce déjà. Pendant le
// chargement (seasonPending), sa place est seulement réservée : le rail du
// squelette est remplacé par celui de la page, et une animation commencée là
// serait coupée net.
export function Rail({ seasonPending = false }: { seasonPending?: boolean }) {
  // Date relue au retour sur l'onglet : une page restée ouverte la nuit se recale.
  const [today, setToday] = useState(() => new Date())
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setToday(new Date())
    }
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [])

  return (
    <div className="hidden lg:flex fixed left-7 top-0 bottom-10 w-rail flex-col items-center noren-edge">
      <span aria-hidden="true" className="shrink-0 w-58 h-3 rounded-xs bg-scroll-cap" />
      <div className="w-rail flex-1 min-h-0 flex flex-col pt-8 pb-7 bg-noren text-on-noren rounded-b-lg">
        <span className="px-6 font-display text-display-lg">Constemps</span>
        <span className="px-6 pt-1 text-label font-normal text-cream-soft">{formatToday(today)}</span>
        <span aria-hidden="true" data-surface="noren" className="px-6 pt-1 flex items-center h-6">
          {seasonPending ? null : <SeasonMark season={seasonOf(today)} />}
        </span>
        <nav aria-label="Navigation principale" className="mt-11 flex flex-col gap-2">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `ml-4 h-button flex items-center pl-5 rounded-l-lg font-body text-body-md font-bold no-underline hover:no-underline -outline-offset-4 transition-colors duration-base ease-standard ${
                  isActive
                    ? 'bg-canvas text-tab-active hover:text-tab-active'
                    : 'text-on-noren hover:text-on-noren hover:bg-cream-veil focus-visible:outline-cream'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <p className="m-0 mt-auto px-6 font-display text-body-sm text-cream-soft">
          Un peu,
          <br />
          chaque jour.
        </p>
      </div>
      <span aria-hidden="true" data-surface="paper" className="shrink-0 w-1 h-6 rounded-b-xs bg-vermillon" />
    </div>
  )
}
