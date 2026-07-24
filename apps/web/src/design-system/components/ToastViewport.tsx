import type { ToastState } from '../useToast'
import { Notification } from './Notification'

export function ToastViewport({ toast }: { toast: ToastState | null }) {
  if (!toast) return null

  return (
    <div className="fixed top-5 right-5 z-toast">
      <Notification tone={toast.tone} title={toast.title} message={toast.message} />
    </div>
  )
}
