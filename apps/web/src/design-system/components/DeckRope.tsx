import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export interface RopeItem {
  key: string
  node: ReactNode
  // Plaquette immobile, au fil plus pâle (« Nouveau deck »).
  still?: boolean
  // Couleur du fil (couleur du deck, CON-70) ; vermillon par défaut.
  threadClass?: string
}

interface DeckRopeProps {
  items: RopeItem[]
  label: string
  // Cordes empilées sans défilement (Mes decks) plutôt qu'une bande qui défile (accueil).
  stacked?: boolean
}

const PER_PAGE = 3
// Géométrie reprise de S15-accueil-ajuste, sur la grille de 4px : plaquette de
// 104px (w-26), à 16px des bords (gouttière) ; haut du bois à 24px sur les
// côtés, 40px au centre (la plaquette du milieu pend plus bas) ; bande de 172px.
const PLAQUE_WIDTH = 104
const GUTTER = 16
const BODY_TOP_SIDE = 24
const BODY_TOP_MIDDLE = 40
// Corde : courbe quadratique de (-4, 6) à (W + 4, 6), point de contrôle (W/2, 34).
// Le point de contrôle étant au milieu, x varie linéairement avec t : t = (x + 4) / (W + 8).
function ropeY(x: number, width: number): number {
  const t = (x + 4) / (width + 8)
  return 6 + 56 * t * (1 - t)
}

function chunk<T>(list: T[], size: number): T[][] {
  const pages: T[][] = []
  for (let i = 0; i < list.length; i += size) pages.push(list.slice(i, i + size))
  return pages
}

// Decks suspendus à une corde courbée (CON-68) : pages de 3, défilement
// horizontal aimanté, rien de la page suivante visible au repos, court aperçu
// animé à l'ouverture quand il existe une page suivante. Le fil de chaque
// plaquette part exactement de la corde : sa longueur est calculée d'après la
// largeur réelle de la bande, recalculée au redimensionnement.
export function DeckRope({ items, label, stacked }: DeckRopeProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const update = () => setWidth(strip.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(strip)
    return () => observer.disconnect()
  }, [])

  const pages = chunk(items, PER_PAGE)
  const slots = (w: number) => [GUTTER, (w - PLAQUE_WIDTH) / 2, w - GUTTER - PLAQUE_WIDTH]

  // Mes decks (S14-decks) : une corde par page, empilées, sans défilement. Les
  // plaquettes y portent leur total et font 148px : bande de 196px, ombre comprise.
  if (stacked) {
    return (
      <div ref={stripRef} role="list" aria-label={label} className="-mx-gutter flex flex-col gap-2">
        {pages.map((page, pageIndex) => (
          <div key={page[0].key} className="relative h-49">
            {width > 0 ? renderBand(page, pageIndex) : null}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={stripRef}
      role="list"
      aria-label={label}
      className="rope-strip -mx-gutter h-43 overflow-x-auto overflow-y-hidden snap-x snap-mandatory overscroll-x-contain"
    >
      <div className={`flex h-full ${pages.length > 1 ? 'rope-peek' : ''}`}>
        {pages.map((page, pageIndex) => (
          <div key={page[0].key} className="relative flex-none w-full h-full snap-start">
            {width > 0 ? renderBand(page, pageIndex) : null}
          </div>
        ))}
      </div>
    </div>
  )

  // Corde courbe et plaquettes d'une page, fils calculés pour toucher la corde.
  function renderBand(page: RopeItem[], pageIndex: number) {
    return (
      <>
        <svg aria-hidden="true" className="absolute left-0 top-0 w-full h-8 overflow-visible" viewBox={`0 0 ${width} 32`} preserveAspectRatio="none">
          <path d={`M-4 6 Q ${width / 2} 34 ${width + 4} 6`} className="stroke-rope" strokeWidth="2" fill="none" />
        </svg>
        {page.map((item, slot) => {
          const left = slots(width)[slot]
          const top = ropeY(left + PLAQUE_WIDTH / 2, width)
          const bodyTop = slot === 1 ? BODY_TOP_MIDDLE : BODY_TOP_SIDE
          return (
            <div
              key={item.key}
              role="listitem"
              className={`absolute flex flex-col items-center w-26 origin-top ${item.still ? '' : 'animate-sway'}`}
              // Positions calculées (corde courbe) : seules valeurs hors grille, imposées par la géométrie.
              style={{ left, top, animationDelay: `${-2 * (pageIndex * PER_PAGE + slot)}s` }}
            >
              <span aria-hidden="true" data-surface="paper" className={`w-thread ${item.threadClass ?? 'bg-vermillon'} ${item.still ? 'opacity-50' : ''}`} style={{ height: bodyTop - top }} />
              {item.node}
            </div>
          )
        })}
      </>
    )
  }
}
