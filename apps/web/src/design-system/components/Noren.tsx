import type { ReactNode } from 'react'

interface NorenProps {
  // tall : rideau plus long de l'écran de connexion.
  tall?: boolean
  // Contenu des trois pans, de gauche à droite (rideau de la révision, CON-72) :
  // le rideau s'allonge et chaque pan porte son contenu en bas.
  panels?: [ReactNode, ReactNode, ReactNode]
  // Grand écran sans rail (CON-75, S20-C-revision et S20-C-connexion) : sept pans
  // sur toute la largeur, 56px pour la connexion (tall), 40px pour la révision.
  wide?: boolean
}

// Bas de chaque pan quand il porte un contenu (V7-revision) : le cercle du milieu
// descend plus bas que le retour et le nom du deck.
const panelPadding = ['pb-4', 'pb-2', 'pb-5']
const WIDE_PANELS = 7

// Rideau d'en-tête (noren, CON-57) : trois pans indigo en haut de chaque écran,
// bas arrondis, séparés de 4px. Décoratif, sauf quand ses pans portent un contenu.
export function Noren({ tall, panels, wide }: NorenProps) {
  if (wide) {
    return (
      <div aria-hidden="true" className={`relative grid grid-cols-7 gap-1 shrink-0 noren-edge ${tall ? 'h-noren-wide-tall' : 'h-noren-wide'}`}>
        {Array.from({ length: WIDE_PANELS }, (_, i) => (
          <div key={i} className="bg-noren rounded-b-lg" />
        ))}
      </div>
    )
  }

  if (panels) {
    return (
      <div className="relative grid grid-cols-3 gap-1 shrink-0 h-noren-review noren-edge">
        {panels.map((panel, i) => (
          <div key={i} className={`min-w-0 flex flex-col items-center justify-end px-2 bg-noren text-on-noren rounded-b-lg ${panelPadding[i]}`}>
            {panel}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div aria-hidden="true" className={`relative grid grid-cols-3 gap-1 shrink-0 noren-edge ${tall ? 'h-noren-tall' : 'h-noren'}`}>
      <div className="bg-noren rounded-b-lg" />
      <div className="bg-noren rounded-b-lg" />
      <div className="bg-noren rounded-b-lg" />
    </div>
  )
}
