import type { ReactNode } from 'react'

interface ScrollProps {
  children: ReactNode
  // Nom de la région pour les lecteurs d'écran (ex. « Cette semaine »).
  label?: string
  // Grand écran (CON-75, S20-C) : aligné en haut de sa rangée plutôt que centré,
  // et plus large dès 1280px (papier de 416px) ; à 1024px, la taille mobile tient
  // à côté de la lanterne.
  wide?: boolean
  // Révision sur grand écran (CON-75, S20-C-revision) : colonne de droite de
  // 420px (460px dès 1280px), alignée en haut.
  review?: boolean
}

// Rouleau suspendu (kakejiku, CON-57) : cordon et clou, barre du haut à embouts,
// papier dans sa monture qui se déroule à l'ouverture, barre du bas plus lourde.
// Réutilisé par l'accueil, les stats, le profil et le retour de l'IA.
export function Scroll({ children, label, wide, review }: ScrollProps) {
  const top = review ? 'lg:w-105 xl:w-115' : wide ? 'xl:w-108' : ''
  const mount = review ? 'lg:w-101 xl:w-111' : wide ? 'xl:w-104' : ''
  const bottom = review ? 'lg:w-107 xl:w-117' : wide ? 'xl:w-110' : ''
  return (
    <section aria-label={label} className={`self-center flex flex-col items-center ${wide || review ? 'lg:self-start lg:shrink-0' : ''}`}>
      <svg viewBox="0 0 130 18" fill="none" aria-hidden="true" className="block w-32 h-5">
        <path d="M6 17 L65 3 L124 17" className="stroke-rope" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="65" cy="3" r="2.6" className="fill-indigo" />
      </svg>
      <div aria-hidden="true" className={`relative w-80 h-2 rounded-sm bg-scroll-rail ${top}`}>
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-3 rounded-xs bg-scroll-cap" />
        <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-3 rounded-xs bg-scroll-cap" />
      </div>
      <div className={`scroll-unroll w-76 px-2 flex bg-scroll-mount ${mount}`}>
        <div className="flex-1 min-w-0 flex flex-col items-center gap-2 px-4 pt-4 pb-4 bg-paper text-paper-ink text-center" data-surface="paper">{children}</div>
      </div>
      <div aria-hidden="true" className={`relative w-82 h-3 rounded-sm bg-scroll-rail ${bottom}`}>
        <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-4 rounded-xs bg-scroll-cap" />
        <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-4 rounded-xs bg-scroll-cap" />
      </div>
    </section>
  )
}
