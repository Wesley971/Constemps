export type SealGlyph = 'check' | 'alert' | 'info'

interface NotificationSealProps {
  glyph: SealGlyph
  // plaque : sceau de la notification (28 px, double liseré). field : petit
  // sceau « ! » devant un message d'erreur de champ (12 px, tient dans la ligne).
  size?: 'plaque' | 'field'
  // Couleur du sceau (classe text-*), lue par bg-current et le liseré.
  toneClass?: string
  className?: string
}

// Sceau penché des notifications et des erreurs (CON-78, S19-A) : fond de la
// couleur du ton, glyphe en on-accent. Décoratif, le texte porte le sens.
export function NotificationSeal({ glyph, size = 'plaque', toneClass = 'text-vermillon', className = '' }: NotificationSealProps) {
  const box =
    size === 'plaque'
      ? 'size-7 -rotate-6 shadow-seal-sm text-body-sm'
      : 'size-3 -rotate-6 text-micro'
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 inline-flex items-center justify-center rounded-verdict bg-current font-display font-bold leading-none ${box} ${toneClass} ${className}`}
    >
      {glyph === 'check' ? (
        <svg viewBox="0 0 24 24" className="size-3 text-on-accent">
          <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <span className="text-on-accent">{glyph === 'alert' ? '!' : 'i'}</span>
      )}
    </span>
  )
}
