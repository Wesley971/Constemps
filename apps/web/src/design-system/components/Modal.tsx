import type { ReactNode } from 'react'
import { Button } from './Button'
import { IconCircleButton } from './IconCircleButton'

export function ModalScrim({ children, onScrimClick }: { children: ReactNode; onScrimClick?: () => void }) {
  return (
    <div
      onClick={onScrimClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-scrim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal)',
      }}
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
        style={{
          position: 'relative',
          width: 420,
          maxWidth: '90vw',
          background: 'var(--white)',
          borderRadius: 'var(--radius-modal)',
          boxShadow: 'var(--elevation-4)',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ font: 'var(--text-display-sm)', color: 'var(--ink)' }}>{title}</span>
          <IconCircleButton icon="ph:x-bold" tone="ghost" size={32} onClick={onClose} />
        </div>
        <div style={{ font: 'var(--text-body-md)', color: 'var(--inksoft)' }}>{children}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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
