import type { ReactNode } from 'react'
import { Button } from './Button'
import { IconCircleButton } from './IconCircleButton'

export function ModalScrim({ children, onScrimClick }: { children: ReactNode; onScrimClick?: () => void }) {
  return (
    <div onClick={onScrimClick} className="fixed inset-0 bg-scrim flex items-center justify-center z-modal">
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
        className="relative w-105 max-w-[90vw] bg-white rounded-modal shadow-elevation-4 p-7 flex flex-col gap-4"
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
