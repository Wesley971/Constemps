import type { ReactNode } from 'react'
import { Noren } from './Noren'
import { TabBar } from './TabBar'
import { Seigaiha } from './Seigaiha'

interface AppScreenProps {
  children: ReactNode
  // Connexion et inscription (CON-71) : rideau plus long, pas d'onglets.
  tallNoren?: boolean
  withTabs?: boolean
}

// Gabarit des écrans refondus (CON-57) : vagues en bas, rideau en haut, colonne
// centrée de 480px au plus avec la gouttière de 16px, onglets en bas.
export function AppScreen({ children, tallNoren, withTabs = true }: AppScreenProps) {
  return (
    <div className="relative min-h-dvh flex flex-col overflow-x-clip">
      <Seigaiha />
      <div className="relative flex-1 w-full max-w-120 mx-auto flex flex-col">
        <Noren tall={tallNoren} />
        <main className="flex-1 px-gutter pt-3 pb-8 flex flex-col gap-4">{children}</main>
        {withTabs ? <TabBar /> : null}
      </div>
    </div>
  )
}
