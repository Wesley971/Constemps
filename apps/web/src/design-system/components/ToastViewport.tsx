import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { TOAST_DURATION_MS } from '../useToast'
import type { ActiveToast } from '../useToast'
import { Notification } from './Notification'

interface ToastViewportProps {
  toast: ActiveToast | null
  onDismiss: () => void
  // tabs : au-dessus de la barre d'onglets. bottom : écran sans onglets, en bas
  // (connexion). top : en haut de l'écran (révision), pour ne jamais couvrir
  // « Valider ma réponse » ni la notation ; aucun rideau n'y a de croix.
  placement?: 'tabs' | 'bottom' | 'top'
}

const PLACEMENTS = {
  tabs: 'bottom-20',
  bottom: 'bottom-4',
  top: 'top-4',
}

// Notifications en bas de l'écran (CON-70, CON-78), jamais en haut où elles
// recouvriraient la croix d'un rideau, sauf dans la révision, qui n'a pas de
// rideau. Colonne de 480 px moins la gouttière.
// Deux régions toujours montées, pour que l'arrivée d'un texte soit annoncée :
// status (succès, information) et alert (erreur). La plaquette est un bouton qui
// la ferme au toucher, au clic, à Entrée ou Espace, et à Échap quand elle a le
// focus (traité sur elle seule : l'Échap des rideaux n'est jamais intercepté).
// Fermeture automatique en pause tant qu'elle a le focus.
export function ToastViewport({ toast, onDismiss, placement = 'tabs' }: ToastViewportProps) {
  const hintId = useId()
  const [focusedId, setFocusedId] = useState<number | null>(null)
  // Élément qui avait le focus avant la plaquette, pour l'y remettre à la fermeture.
  const previousFocus = useRef<HTMLElement | null>(null)
  const paused = toast !== null && focusedId === toast.id

  useEffect(() => {
    if (!toast || paused) return
    const timer = setTimeout(onDismiss, TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast, paused, onDismiss])

  function close() {
    const previous = previousFocus.current
    previousFocus.current = null
    onDismiss()
    if (previous?.isConnected) previous.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    close()
  }

  const plaque = toast ? (
    <button
      key={toast.id}
      type="button"
      onClick={close}
      onKeyDown={handleKeyDown}
      onFocus={(event) => {
        previousFocus.current = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null
        setFocusedId(toast.id)
      }}
      onBlur={() => setFocusedId(null)}
      aria-describedby={hintId}
      className="pointer-events-auto block w-full min-h-hit p-0 border-none bg-transparent cursor-pointer focus-visible:outline-offset-4"
    >
      <Notification tone={toast.tone} title={toast.title} message={toast.message} animated hang={placement === 'top'} />
    </button>
  ) : null
  const urgent = toast?.tone === 'danger'

  return (
    <div className={`fixed inset-x-0 z-toast pointer-events-none ${PLACEMENTS[placement]}`}>
      <div className="w-full max-w-120 mx-auto px-gutter">
        <span id={hintId} className="sr-only">
          Toucher pour fermer
        </span>
        <div role="status">{urgent ? null : plaque}</div>
        <div role="alert">{urgent ? plaque : null}</div>
      </div>
    </div>
  )
}
