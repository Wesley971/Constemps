import type { ToastState } from '../useToast'
import { Notification } from './Notification'

// Notifications en bas de l'écran, juste au-dessus de la barre d'onglets
// (CON-70) : en haut, elles recouvraient la croix d'un rideau ouvert. Centrées
// dans la colonne de 480px, avec la gouttière de 16px.
export function ToastViewport({ toast }: { toast: ToastState | null }) {
  if (!toast) return null

  return (
    <div className="fixed inset-x-0 bottom-20 z-toast px-gutter flex justify-center pointer-events-none">
      <div className="pointer-events-auto">
        <Notification tone={toast.tone} title={toast.title} message={toast.message} />
      </div>
    </div>
  )
}
