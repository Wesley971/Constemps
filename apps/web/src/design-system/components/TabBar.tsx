import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/dashboard', label: 'Accueil' },
  { to: '/decks', label: 'Decks' },
  { to: '/profile', label: 'Profil' },
]

// Navigation principale en trois onglets en forme de rideau, en bas d'écran
// (CON-57). NavLink pose aria-current="page" sur l'onglet actif ; « Decks » reste
// actif dans un deck, ses stats et sa révision. Positionnée (relative) pour
// passer au-dessus du fond seigaiha, visible à travers les onglets inactifs.
export function TabBar() {
  return (
    <nav aria-label="Navigation principale" className="relative grid grid-cols-3 gap-1 h-tabbar shrink-0">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex items-center justify-center pb-2 rounded-t-lg font-body text-body-sm font-bold no-underline hover:no-underline transition-colors duration-base ease-standard ${
              isActive ? 'bg-tab-active text-tab-active-ink hover:text-tab-active-ink' : 'bg-indigo-veil text-indigo hover:bg-indigo-tint hover:text-indigo'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
