import type { ReactNode } from 'react'
import { Noren } from './Noren'
import { TabBar } from './TabBar'
import { Seigaiha } from './Seigaiha'

// Gabarit des écrans refondus (CON-57) : vagues en bas, rideau en haut, colonne
// centrée de 480px au plus avec la gouttière de 16px, onglets en bas.
export function AppScreen({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh flex flex-col overflow-x-clip">
      <Seigaiha />
      <div className="relative flex-1 w-full max-w-120 mx-auto flex flex-col">
        <Noren />
        <main className="flex-1 px-gutter pt-3 pb-8 flex flex-col gap-4">{children}</main>
        <TabBar />
      </div>
    </div>
  )
}
