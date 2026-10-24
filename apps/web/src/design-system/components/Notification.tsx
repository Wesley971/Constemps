import { NotificationSeal } from './NotificationSeal'
import type { SealGlyph } from './NotificationSeal'

// Trois tons (CON-78) : l'avertissement est fusionné avec l'information.
export type NotificationTone = 'success' | 'danger' | 'info'

interface NotificationProps {
  title: string
  message?: string
  tone?: NotificationTone
  // Arrivée animée (notification temporaire). Sans : erreur fixe dans la page.
  animated?: boolean
  role?: 'status' | 'alert'
  // Posée en haut de l'écran : pointe vers le bas, arrivée par le haut.
  hang?: boolean
  className?: string
}

const seals: Record<NotificationTone, { glyph: SealGlyph; toneClass: string }> = {
  success: { glyph: 'check', toneClass: 'text-vermillon' },
  danger: { glyph: 'alert', toneClass: 'text-vermillon' },
  info: { glyph: 'info', toneClass: 'text-indigo' },
}

// Plaquette de bois (CON-78, S19-A) : pointe douce en haut comme les ema, sceau
// penché à gauche, titre en Kaisei. Encre du jour dans les deux thèmes (surface
// paper), le bois suit le thème comme les plaquettes des decks.
export function Notification({ title, message, tone = 'info', animated = false, role, hang = false, className = '' }: NotificationProps) {
  const seal = seals[tone]
  const arrival = animated ? (hang ? 'plaque-drop' : 'plaque-rise') : ''
  const shape = hang ? 'plaque-shape-down pt-3 pb-6' : 'plaque-shape pt-6 pb-3'
  return (
    <div role={role} className={`w-full drop-shadow-plaque ${arrival} ${className}`}>
      <div data-surface="paper" className={`${shape} flex items-center gap-3 px-4 bg-wood text-wood-ink text-left`}>
        <NotificationSeal glyph={seal.glyph} toneClass={seal.toneClass} className={animated ? 'seal-stamp' : ''} />
        <span className="flex flex-col min-w-0">
          <span className="font-display text-body-lg font-bold break-words">{title}</span>
          {message ? <span className="font-body text-caption text-wood-ink-soft break-words">{message}</span> : null}
        </span>
      </div>
    </div>
  )
}
