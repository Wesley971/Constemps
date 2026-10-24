import type { ReactNode } from 'react'
import { Noren } from './Noren'
import { Rail } from './Rail'
import { TabBar } from './TabBar'
import { Seigaiha } from './Seigaiha'

interface AppScreenProps {
  children: ReactNode
  // Connexion et inscription (CON-71) : rideau plus long, pas d'onglets.
  tallNoren?: boolean
  withTabs?: boolean
  // Révision (CON-72) : pans du rideau qui portent un contenu, et marée des
  // vagues qui monte avec le palier (0 à 1).
  norenPanels?: [ReactNode, ReactNode, ReactNode]
  rise?: number
}

// Gabarit des écrans refondus (CON-57) : vagues en bas, rideau en haut, colonne
// centrée de 480px au plus avec la gouttière de 16px, onglets en bas.
// Grands écrans (CON-75, S20-C), dès 1024px, pour les écrans à onglets : le rail
// remplace le rideau et les onglets, le contenu (924px au plus) est centré dans
// l'espace à sa droite, avec 56px de marge au moins. Les vagues restent sur
// toute la largeur.
export function AppScreen({ children, tallNoren, withTabs = true, norenPanels, rise }: AppScreenProps) {
  return (
    <div className="relative min-h-dvh flex flex-col overflow-x-clip">
      <Seigaiha rise={rise} />
      {withTabs ? <Rail /> : null}
      <div className={`relative flex-1 w-full max-w-120 mx-auto flex flex-col ${withTabs ? 'lg:w-auto lg:max-w-none lg:mr-0 lg:ml-rail-zone lg:px-14' : ''}`}>
        <div className={withTabs ? 'lg:hidden' : undefined}>
          <Noren tall={tallNoren} panels={norenPanels} />
        </div>
        <main className={`flex-1 px-gutter pt-3 pb-8 flex flex-col gap-4 ${withTabs ? 'lg:w-full lg:max-w-content lg:mx-auto lg:px-0 lg:pt-9 lg:pb-12 lg:gap-6' : ''}`}>
          {children}
        </main>
        {withTabs ? <TabBar /> : null}
      </div>
    </div>
  )
}
