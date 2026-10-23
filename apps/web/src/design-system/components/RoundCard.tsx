import type { ReactNode } from 'react'

interface RoundCardProps {
  // Pastille du type de carte, au-dessus du recto.
  tag: ReactNode
  children: ReactNode
  // small : carte réduite pendant le retour de l'IA (S15-retour-ia).
  small?: boolean
  // Rejoue l'arrivée à l'encre : à changer pour chaque nouvelle carte.
  inkKey?: string
}

// Carte ronde de la révision (CON-72, V7-revision) : papier rond qui arrive comme
// de l'encre qui se diffuse, avec un halo indigo qui s'étend derrière lui.
export function RoundCard({ tag, children, small, inkKey }: RoundCardProps) {
  const size = small ? 'size-50 px-6 gap-2' : 'size-75 px-10 gap-3'
  return (
    <div key={inkKey} className={`relative shrink-0 ${small ? 'size-50' : 'size-75'}`}>
      <div aria-hidden="true" className="ink-bloom absolute inset-0 rounded-full" />
      <section className={`ink-in relative ${size} rounded-full bg-paper-card shadow-round-card flex flex-col items-center justify-center text-center`}>
        {tag}
        {children}
      </section>
    </div>
  )
}
