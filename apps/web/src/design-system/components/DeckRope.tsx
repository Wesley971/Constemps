import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { FavoriteKnot } from './FavoriteKnot'

export interface RopeItem {
  key: string
  node: ReactNode
  // Plaquette immobile, au fil plus pâle (« Nouveau deck »).
  still?: boolean
  // Couleur du fil (couleur du deck, CON-70) ; vermillon par défaut.
  threadClass?: string
  // Deck favori (CON-74) : nœud noué sur le fil, dans la couleur du fil (classe
  // text-*, voir deckKnotClass). Absent hors favori.
  knotClass?: string
}

interface DeckRopeProps {
  items: RopeItem[]
  label: string
  // Cordes empilées sans défilement (Mes decks) plutôt qu'une bande qui défile (accueil).
  stacked?: boolean
}

const PER_PAGE = 3
// Géométrie reprise de S15-accueil-ajuste, sur la grille de 4px : plaquette de
// 104px (w-26), à 16px des bords (gouttière) ; haut du bois à 36px sur les
// côtés, 40px au centre (la plaquette du milieu pend plus bas) ; bande de 172px.
// Côtés à 36px (24 sur la planche) depuis CON-74 : le fil le plus court y fait
// 20px dès 320px de large, la place du nœud du favori, noué ou non.
const PLAQUE_WIDTH = 104
const GUTTER = 16
const BODY_TOP_SIDE = 36
const BODY_TOP_MIDDLE = 40
// Corde : courbe quadratique de (-4, 6) à (W + 4, 6), point de contrôle (W/2, 34).
// Le point de contrôle étant au milieu, x varie linéairement avec t : t = (x + 4) / (W + 8).
function ropeY(x: number, width: number): number {
  const t = (x + 4) / (width + 8)
  return 6 + 56 * t * (1 - t)
}

// Nœud du favori sur le fil (FavoriteKnot en size-4, 16px) : encre de 2,5 à
// 14,5px dans sa boîte et 6,5px de demi-largeur (tracé de FavoriteKnot). Centré
// entre le bas de la corde (son demi-trait, au plus haut sur la largeur du nœud)
// et la pointe de la plaquette, il garde au moins 3px de vide de chaque côté sur
// le fil le plus court (20px). Il ne change jamais la hauteur.
const KNOT_INK_TOP = 2.5
const KNOT_INK_HEIGHT = 12
const KNOT_HALF_WIDTH = 6.5

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
          const center = left + PLAQUE_WIDTH / 2
          const top = ropeY(center, width)
          const bodyTop = slot === 1 ? BODY_TOP_MIDDLE : BODY_TOP_SIDE
          const thread = bodyTop - top
          const ropeEdge = Math.max(ropeY(center - KNOT_HALF_WIDTH, width), ropeY(center + KNOT_HALF_WIDTH, width)) + 1 - top
          return (
            <div
              key={item.key}
              role="listitem"
              className={`absolute flex flex-col items-center w-26 origin-top ${item.still ? '' : 'animate-sway'}`}
              // Positions calculées (corde courbe) : seules valeurs hors grille, imposées par la géométrie.
              style={{ left, top, animationDelay: `${-2 * (pageIndex * PER_PAGE + slot)}s` }}
            >
              {/* Fil d'un deck : couleur de deckThreadClass, éclaircie la nuit. Fil
                  par défaut (« Nouveau deck ») : vermillon du papier, inchangé. */}
              <span
                aria-hidden="true"
                data-surface={item.threadClass ? undefined : 'paper'}
                className={`w-thread ${item.threadClass ?? 'bg-vermillon'} ${item.still ? 'opacity-50' : ''}`}
                style={{ height: thread }}
              />
              {item.knotClass ? (
                <FavoriteKnot
                  filled
                  className={`absolute left-1/2 -translate-x-1/2 size-4 ${item.knotClass}`}
                  // Centré dans le vide entre la corde et la plaquette.
                  style={{ top: ropeEdge + (thread - ropeEdge - KNOT_INK_HEIGHT) / 2 - KNOT_INK_TOP }}
                />
              ) : null}
              {item.node}
            </div>
          )
        })}
      </>
    )
  }
}
