import { useCallback, useEffect, useState } from 'react'
import type { NotificationTone } from './components/Notification'

export interface ToastState {
  tone: NotificationTone
  title: string
  message?: string
}

const TOAST_DURATION_MS = 4000

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)

  const notify = useCallback((next: ToastState) => setToast(next), [])
  const dismiss = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast])

  return { toast, notify, dismiss }
}
