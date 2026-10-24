import { useCallback, useRef, useState } from 'react'
import type { NotificationTone } from './components/Notification'

export interface ToastState {
  tone: NotificationTone
  title: string
  message?: string
}

// Notification affichée : un identifiant par appel, pour que deux notifications
// identiques de suite rejouent l'animation et relancent la minuterie.
export interface ActiveToast extends ToastState {
  id: number
}

// Fermeture automatique, gérée par ToastViewport (en pause pendant le focus).
export const TOAST_DURATION_MS = 4000

export function useToast() {
  const [toast, setToast] = useState<ActiveToast | null>(null)
  const nextId = useRef(0)

  const notify = useCallback((next: ToastState) => setToast({ ...next, id: ++nextId.current }), [])
  const dismiss = useCallback(() => setToast(null), [])

  return { toast, notify, dismiss }
}
