import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'
import { IconCircleButton } from './IconCircleButton'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function ModalScrim({ children, onScrimClick }: { children: ReactNode; onScrimClick?: () => void }) {
  const scrimRef = useRef<HTMLDivElement>(null)
  const onScrimClickRef = useRef(onScrimClick)
  onScrimClickRef.current = onScrimClick

  useEffect(() => {
    const scrim = scrimRef.current
    if (!scrim) return

    // Un groupe de radios natif n'a qu'un seul arrêt de tabulation réel (le bouton
    // coché, ou le premier si aucun ne l'est) : les autres inputs du groupe sont
    // exclus pour refléter le comportement natif du navigateur.
    function getFocusable(): HTMLElement[] {
      const all = Array.from(scrim!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      )

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

    const focusable = getFocusable()
    ;(focusable[0] ?? scrim).focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onScrimClickRef.current?.()
        return
      }
      if (event.key !== 'Tab') return

      const items = getFocusable()
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (event.shiftKey) {
        if (active === first || !scrim!.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last || !scrim!.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      ref={scrimRef}
      onClick={onScrimClick}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="fixed inset-0 bg-scrim flex items-center justify-center z-modal"
    >
      {children}
    </div>
  )
}

interface ConfirmModalProps {
  title: string
  children: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void
  onClose: () => void
}

// Le Modal du design system a un pied de page fixe (Annuler / Copy link, propre a la page
// profil) : ce composant reprend le meme habillage (rayon, ombre, header) avec des actions
// parametrables, necessaire pour une confirmation de suppression.
export function ConfirmModal({ title, children, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', confirmVariant = 'primary', onConfirm, onClose }: ConfirmModalProps) {
  return (
    <ModalScrim onScrimClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-105 max-w-[90vw] bg-paper rounded-lg shadow-modal p-7 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <span className="font-display text-display-sm text-ink">{title}</span>
          <IconCircleButton icon="ph:x-bold" tone="ghost" size="md" onClick={onClose} />
        </div>
        <div className="font-body text-body-md text-inksoft">{children}</div>
        <div className="flex gap-2.5 justify-end">
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </ModalScrim>
  )
}
