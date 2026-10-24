import { useLocation } from 'react-router-dom'
import { Rail } from './Rail'
import { Skeleton } from './Skeleton'

export function PageSkeleton() {
  // Grand écran (CON-75) : le rail est déjà là pendant le chargement des écrans à
  // onglets, et le squelette occupe la zone de contenu, pour qu'aucun bloc ne
  // saute à l'arrivée de la page. La révision, plein écran, n'a pas de rail.
  const withRail = !useLocation().pathname.endsWith('/review')

  return (
    <>
      {withRail ? <Rail /> : null}
      <div className={`max-w-wrap mx-auto flex flex-col gap-4 pt-5 ${withRail ? 'lg:max-w-none lg:ml-rail-zone lg:mr-0 lg:px-14 lg:pt-9' : ''}`}>
        <div className="flex flex-col gap-4 lg:w-full lg:max-w-content lg:mx-auto">
          <Skeleton className="w-55 h-7" />
          <Skeleton className="w-full h-20" radius="lg" />
          <Skeleton className="w-full h-20" radius="lg" />
          <Skeleton className="w-full h-20" radius="lg" />
        </div>
      </div>
    </>
  )
}
