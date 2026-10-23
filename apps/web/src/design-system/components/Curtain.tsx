import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Button } from './Button'
import { IconButton } from './IconButton'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Bas du rideau (série 18) : trois pans arrondis séparés par deux fentes.
const HEM_RADIUS = 24
const SLOT_WIDTH = 4
// Hauteur droite de la fente, sous son sommet arrondi.
const SLOT_DEPTH = 44
const SLOT_TOP_RADIUS = SLOT_WIDTH / 2

// Contour complet du rideau à sa taille réelle, en une seule pièce : un tracé
// étiré déformerait les arrondis, un bas accolé laisserait un trait de raccord.
function curtainPath(w: number, h: number): string {
  const r = HEM_RADIUS
  const panel = (w - 2 * SLOT_WIDTH) / 3
  const slotTop = h - SLOT_DEPTH
  // Une fente : on remonte le bord droit d'un pan, sommet arrondi, on redescend.
  const slot = (right: number) =>
    `A${r} ${r} 0 0 1 ${right} ${h - r} V${slotTop} A${SLOT_TOP_RADIUS} ${SLOT_TOP_RADIUS} 0 0 0 ${right - SLOT_WIDTH} ${slotTop} V${h - r} A${r} ${r} 0 0 1 ${right - SLOT_WIDTH - r} ${h}`
  const rightSlot = w - panel
  const leftSlot = panel + SLOT_WIDTH
  return [
    `M0 0 H${w} V${h - r}`,
    `A${r} ${r} 0 0 1 ${w - r} ${h} H${rightSlot + r}`,
    slot(rightSlot),
    `H${leftSlot + r}`,
    slot(leftSlot),
    `H${r} A${r} ${r} 0 0 1 0 ${h - r} Z`,
  ].join(' ')
}

// Repli : sans prise en charge de path(), le rideau garde un bas droit à rayons
// simples (rounded-b-curtain), sans rien changer à la mise en page.
const SUPPORTS_PATH = typeof CSS !== 'undefined' && CSS.supports('clip-path', 'path("M0 0 H1 V1 Z")')

// Un groupe de radios natif n'a qu'un seul arrêt de tabulation réel (le bouton
// coché, ou le premier si aucun ne l'est) : les autres inputs du groupe sont
// exclus pour refléter le comportement natif du navigateur.
function getFocusable(root: HTMLElement): HTMLElement[] {
  const all = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => el.offsetParent !== null)

  const radiosByName = new Map<string, HTMLInputElement[]>()
  for (const el of all) {
    if (el instanceof HTMLInputElement && el.type === 'radio' && el.name) {
      radiosByName.set(el.name, [...(radiosByName.get(el.name) ?? []), el])
    }
  }

  const skip = new Set<HTMLElement>()
  for (const group of radiosByName.values()) {
    const tabStop = group.find((r) => r.checked) ?? group[0]
    for (const r of group) {
      if (r !== tabStop) skip.add(r)
    }
  }

  return all.filter((el) => !skip.has(el))
}

interface CurtainProps {
  title: string
  onClose: () => void
  children: ReactNode
  // Le clic sur le fond assombri ferme seulement les confirmations : un rideau
  // de saisie ne doit pas perdre un texte sur un clic à côté. La croix et
  // Échap ferment toujours.
  dismissOnScrim?: boolean
  // Les confirmations n'ont pas de croix (S18-supprimer) : Annuler la remplace.
  showClose?: boolean
}

// Fenêtre en rideau (CON-70, série 18) : rideau indigo qui descend du haut, texte
// crème, fond assombri derrière. Contenu sous data-surface="curtain" : les champs,
// étiquettes et icônes du design system y prennent leurs couleurs claires.
export function Curtain({ title, onClose, children, dismissOnScrim = false, showClose = true }: CurtainProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [clip, setClip] = useState<string | null>(null)

  // Tracé mesuré avant l'affichage, recalculé quand la taille change (liste de
  // propositions qui s'allonge, rotation de l'écran).
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel || !SUPPORTS_PATH) return
    const update = () => setClip(`path("${curtainPath(panel.offsetWidth, panel.offsetHeight)}")`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(panel)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null

    // Premier élément du contenu (champ, ou Annuler pour une confirmation),
    // plutôt que la croix.
    const content = contentRef.current
    ;((content && getFocusable(content)[0]) ?? dialog).focus()

    // La page ne défile plus derrière le rideau.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const items = getFocusable(dialog!)
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (event.shiftKey) {
        if (active === first || !dialog!.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last || !dialog!.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      // Retour du focus sur le bouton qui a ouvert le rideau, s'il existe encore
      // (un deck supprimé emporte son bouton).
      if (opener && opener.isConnected) opener.focus()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-modal">
      <div aria-hidden="true" className="scrim-in absolute inset-0 bg-scrim" onClick={dismissOnScrim ? onClose : undefined} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="curtain-drop relative w-full max-w-120 mx-auto outline-none"
      >
        <div
          ref={panelRef}
          data-curtain-panel=""
          className="max-h-dvh flex flex-col pb-12 bg-indigo rounded-b-curtain"
          style={clip ? ({ clipPath: clip } as CSSProperties) : undefined}
        >
          <div data-surface="curtain" className="min-h-0 flex flex-col gap-5 pt-8 px-6 pb-6">
            <div className="flex items-center justify-between gap-4">
              <h2 id={titleId} className="m-0 font-display text-display-lg break-words">
                {title}
              </h2>
              {showClose ? <IconButton icon="close" label="Fermer" onClick={onClose} /> : null}
            </div>
            <div ref={contentRef} className="min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-5 -mx-1 px-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CurtainConfirmProps {
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  // Action destructive : bouton crème au texte terracotta (S18-supprimer).
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

// Confirmation en rideau : texte, puis Annuler et l'action côte à côte. Le clic
// sur le fond ferme, comme Annuler.
export function CurtainConfirm({ title, children, confirmLabel, cancelLabel = 'Annuler', danger, busy, onConfirm, onClose }: CurtainConfirmProps) {
  return (
    <Curtain title={title} onClose={onClose} dismissOnScrim showClose={false}>
      {/* Formulaire pour qu'Entrée dans un champ (mot de passe de la suppression du
          compte) valide la confirmation (CON-71). noValidate : la page garde la main
          sur le message d'un champ vide. Annuler reste un simple bouton. */}
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault()
          if (!busy) onConfirm()
        }}
      >
        <div className="flex flex-col gap-4 text-body-md text-ink">{children}</div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="curtain-ghost" disabled={busy} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant={danger ? 'curtain-danger' : 'curtain'} disabled={busy}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Curtain>
  )
}
