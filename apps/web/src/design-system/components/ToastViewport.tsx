import type { ToastState } from '../useToast'
import { Notification } from './Notification'

export function ToastViewport({ toast }: { toast: ToastState | null }) {
  if (!toast) return null

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 'var(--z-toast)' }}>
      <Notification tone={toast.tone} title={toast.title} message={toast.message} />
    </div>
  )
}
