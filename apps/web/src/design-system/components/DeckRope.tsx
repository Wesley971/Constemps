import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode, Ref } from 'react'
import { FavoriteKnot } from './FavoriteKnot'
import { useWideLayout } from '../useWideLayout'

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
// Grand écran (CON-75, S20-C-rail et S20-C-decks) : autant de plaquettes par
// corde que la largeur en laisse, à 24px d'écart au moins (7 sur 924px, 5 sur
// 668px), 5 par corde dans Mes decks ; écarts égaux, bords compris. Haut du bois
// à 44px pour toutes, comme sur les planches : le fil le plus court, au creux de
// la corde (20px au plus bas), fait 24px, la place du nœud du favori.
const WIDE_MIN_GAP = 24
const WIDE_STACKED_PER_PAGE = 5
const BODY_TOP_WIDE = 44
// Écran ultra large (CON-75, S24-ultralarge) : dès 1120px de corde (vers 2300px
// d'écran), deux cordes de 6 plaquettes empilées par page, comme sur la planche.
const DOUBLE_MIN_WIDTH = 1120
const DOUBLE_PER_ROPE = 6
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
  // Page visible de la bande (grand écran) et chevron à focaliser une fois arrivé.
  const [currentPage, setCurrentPage] = useState(0)
  const previousRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const pendingFocus = useRef<'previous' | 'next' | null>(null)

  useEffect(() => {
    const target = pendingFocus.current === 'previous' ? previousRef.current : pendingFocus.current === 'next' ? nextRef.current : null
    if (!target) return
    pendingFocus.current = null
    target.focus()
  }, [currentPage])

  useLayoutEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const update = () => setWidth(strip.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(strip)
    return () => observer.disconnect()
  }, [])

  const wide = useWideLayout()
  const double = wide && !stacked && width >= DOUBLE_MIN_WIDTH
  const perRope = !wide
    ? PER_PAGE
    : stacked
      ? WIDE_STACKED_PER_PAGE
      : double
        ? DOUBLE_PER_ROPE
        : Math.max(1, Math.floor((width - WIDE_MIN_GAP) / (PLAQUE_WIDTH + WIDE_MIN_GAP)))
  const perPage = double ? 2 * perRope : perRope
  const pages = chunk(items, perPage)
  const slotLeft = (slot: number, w: number) => {
    if (!wide) return [GUTTER, (w - PLAQUE_WIDTH) / 2, w - GUTTER - PLAQUE_WIDTH][slot]
    const gap = (w - perRope * PLAQUE_WIDTH) / (perRope + 1)
    return gap + slot * (PLAQUE_WIDTH + gap)
  }

  // Mes decks (S14-decks) : une corde par page, empilées, sans défilement. Les
  // plaquettes y portent leur total et font 148px : bande de 196px, ombre comprise.
  if (stacked) {
    return (
      <div ref={stripRef} role="list" aria-label={label} className="-mx-gutter flex flex-col gap-2 lg:mx-0 lg:gap-4">
        {pages.map((page, pageIndex) => (
          <div key={page[0].key} className="relative h-49">
            {width > 0 ? renderBand(page, pageIndex) : null}
          </div>
        ))}
      </div>
    )
  }

  // Grand écran (CON-75) : chevrons au bout de la corde pour changer de page à la
  // souris, seulement s'il existe une page avant ou après.
  // Bornée : un redimensionnement peut réduire le nombre de pages sans défilement.
  const visiblePage = Math.min(currentPage, pages.length - 1)
  const showPrevious = wide && visiblePage > 0
  const showNext = wide && visiblePage < pages.length - 1

  function goTo(target: number) {
    const strip = stripRef.current
    if (!strip) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    strip.scrollTo({ left: target * strip.clientWidth, behavior: reduce ? 'auto' : 'smooth' })
    // Le chevron disparaît sur la première ou la dernière page : le focus passe
    // à l'autre, plutôt que de retomber sur la page.
    if (target === 0 || target === pages.length - 1) pendingFocus.current = target === 0 ? 'next' : 'previous'
  }

  return (
    <div className="relative -mx-gutter lg:mx-0">
      <div
        ref={stripRef}
        role="list"
        aria-label={label}
        onScroll={(event) => {
          const strip = event.currentTarget
          setCurrentPage(strip.clientWidth > 0 ? Math.round(strip.scrollLeft / strip.clientWidth) : 0)
        }}
        className={`rope-strip h-43 ${double ? 'lg:h-92' : 'lg:h-44'} overflow-x-auto overflow-y-hidden snap-x snap-mandatory overscroll-x-contain`}
      >
        <div className={`flex h-full ${pages.length > 1 ? 'rope-peek' : ''}`}>
          {pages.map((page, pageIndex) => (
            <div key={page[0].key} className={`relative flex-none w-full h-full snap-start ${double ? 'flex flex-col gap-4' : ''}`}>
              {width === 0
                ? null
                : double
                  ? chunk(page, perRope).map((row, rowIndex) => (
                      <div key={row[0].key} className="relative h-44">
                        {renderBand(row, pageIndex, rowIndex * perRope)}
                      </div>
                    ))
                  : renderBand(page, pageIndex)}
            </div>
          ))}
        </div>
      </div>
      {showPrevious ? (
        <RopeChevron ref={previousRef} direction="previous" onClick={() => goTo(visiblePage - 1)} />
      ) : null}
      {showNext ? <RopeChevron ref={nextRef} direction="next" onClick={() => goTo(visiblePage + 1)} /> : null}
    </div>
  )

  // Corde courbe et plaquettes d'une page (ou d'une de ses cordes à partir de la
  // plaquette first), fils calculés pour toucher la corde.
  function renderBand(page: RopeItem[], pageIndex: number, first = 0) {
    return (
      <>
        <svg aria-hidden="true" className="absolute left-0 top-0 w-full h-8 overflow-visible" viewBox={`0 0 ${width} 32`} preserveAspectRatio="none">
          <path d={`M-4 6 Q ${width / 2} 34 ${width + 4} 6`} className="stroke-rope" strokeWidth="2" fill="none" />
        </svg>
        {page.map((item, slot) => {
          const left = slotLeft(slot, width)
          const center = left + PLAQUE_WIDTH / 2
          const top = ropeY(center, width)
          const bodyTop = wide ? BODY_TOP_WIDE : slot === 1 ? BODY_TOP_MIDDLE : BODY_TOP_SIDE
          const thread = bodyTop - top
          const ropeEdge = Math.max(ropeY(center - KNOT_HALF_WIDTH, width), ropeY(center + KNOT_HALF_WIDTH, width)) + 1 - top
          return (
            <div
              key={item.key}
              role="listitem"
              className={`absolute flex flex-col items-center w-26 origin-top ${item.still ? '' : 'animate-sway'}`}
              // Positions calculées (corde courbe) : seules valeurs hors grille, imposées par la géométrie.
              style={{ left, top, animationDelay: `${-2 * (pageIndex * perPage + first + slot)}s` }}
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

// Chevron au pinceau au bout de la corde (grand écran) : vrai bouton de 44px, posé
// dans la marge, centré sur l'extrémité de la corde.
function RopeChevron({ direction, onClick, ref }: { direction: 'previous' | 'next'; onClick: () => void; ref: Ref<HTMLButtonElement> }) {
  const previous = direction === 'previous'
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={previous ? 'Decks précédents' : 'Decks suivants'}
      className={`absolute -top-4 ${previous ? '-left-12' : '-right-12'} size-hit flex items-center justify-center p-0 border-none rounded-full bg-transparent text-indigo cursor-pointer transition-colors duration-base ease-standard hover:bg-indigo-tint`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`size-5 ${previous ? '' : '-scale-x-100'}`} fill="currentColor">
        <path d="M15.6 3.9C13 6.4 10.4 9 7.7 11.4c-.6.5-.6 1.1 0 1.6 2.7 2.4 5.3 4.9 7.6 7.4.5.5 1.1 0 .8-.6-1.9-2.5-4-4.9-6.2-7.4 2.3-2.4 4.7-4.9 6.6-7.5.4-.6-.3-1.4-.9-1z" />
      </svg>
    </button>
  )
}
