type BrushStrokeTone = 'indigo' | 'vermillon' | 'current'

interface BrushStrokeProps {
  tone?: BrushStrokeTone
  // Classes de largeur et de hauteur, ex. « w-24 h-2 » ou « w-full h-2 ».
  className?: string
  // Délai avant le tracé, en ms.
  delayMs?: number
  // Trait atténué, pour un lien secondaire (« Continuer aujourd'hui »).
  muted?: boolean
}

const tones: Record<BrushStrokeTone, string> = {
  indigo: 'text-indigo',
  vermillon: 'text-vermillon',
  // Couleur du texte souligné (verdicts des stats).
  current: '',
}

// Trait de pinceau horizontal qui se trace à l'ouverture (soulignés de
// « Cette semaine », « Reprendre › »...). Décoratif.
export function BrushStroke({ tone = 'indigo', className = 'w-24 h-2', delayMs = 0, muted }: BrushStrokeProps) {
  return (
    <svg
      viewBox="0 0 200 14"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block stroke-in ${tones[tone]} ${muted ? 'opacity-50' : ''} ${className}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <path
        d="M2 9C30 5 90 3 150 4c25 .5 42 2 48 4-8 2.5-38 2-78 1.6-40-.2-80 1.4-116 1.9-3 0-4-1.5-2-2.5z"
        fill="currentColor"
      />
    </svg>
  )
}
