import { useEffect, useId, useRef } from 'react'
import type { ManualRating, SubmitReviewResult } from '../types/review'
import { BrushCircle } from '../design-system/components/BrushCircle'
import { Button, LinkButton } from '../design-system/components/Button'
import { InkRule } from '../design-system/components/InkRule'
import { Label } from '../design-system/components/Label'
import { Scroll } from '../design-system/components/Scroll'
import { RATING_LABELS } from '../design-system/constants'
import { RATINGS } from '../lib/review'
import { frenchSpacing } from '../lib/typography'

interface RatingButtonsProps {
  disabled: boolean
  onRate: (rating: ManualRating) => void
  // Dernière note choisie au clavier : rejoue la tache d'encre sur son bouton.
  inked: { rating: ManualRating; at: number } | null
}

// Notation (V7-revision) : quatre pastilles de verre, Correct en indigo. Une tache
// d'encre s'étend depuis le centre du bouton choisi.
export function RatingButtons({ disabled, onRate, inked }: RatingButtonsProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      <p className="m-0 text-center text-body-md font-medium text-indigo">Comment c’est revenu ?</p>
      <div className={`grid grid-cols-4 gap-2 transition-opacity duration-slow ${disabled ? 'opacity-45' : ''}`}>
        {RATINGS.map(({ rating, key, value }) => {
          const strong = rating === 'GOOD'
          return (
            <button
              key={rating}
              type="button"
              disabled={disabled}
              aria-keyshortcuts={key}
              onClick={() => onRate(rating)}
              className={`relative overflow-hidden h-button rounded-pill border font-body text-body-sm font-bold cursor-pointer disabled:cursor-default ${
                strong ? 'bg-indigo border-indigo text-on-indigo' : 'bg-glass/80 border-glass/75 backdrop-blur-md text-ink'
              }`}
            >
              {inked?.rating === rating ? (
                <span
                  key={inked.at}
                  aria-hidden="true"
                  className={`ink-blot absolute left-1/2 top-1/2 size-4 -ml-2 -mt-2 pointer-events-none ${strong ? 'bg-cream nuit:bg-cream-ink' : 'bg-indigo'}`}
                />
              ) : null}
              {RATING_LABELS[value]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface AiFeedbackProps {
  result: SubmitReviewResult
  reference: string
}

// Retour de l'IA dans le rouleau (S15-retour-ia) : points forts, à améliorer,
// astuce, puis la réponse de référence. Les parties vides sont omises.
export function AiFeedback({ result, reference }: AiFeedbackProps) {
  const sections = [
    result.cePointsForts ? { label: 'Points forts', text: result.cePointsForts } : null,
    result.cePointsAmeliorer ? { label: 'À améliorer', text: result.cePointsAmeliorer } : null,
  ].filter((s): s is { label: string; text: string } => s !== null)

  return (
    <Scroll label="Retour de l’IA">
      <div className="w-full flex flex-col gap-3 text-left">
        {sections.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <Label>{section.label}</Label>
            <p className="m-0 text-body-sm">{frenchSpacing(section.text)}</p>
            <InkRule />
          </div>
        ))}
        {result.piste ? (
          <p className="m-0 text-label text-indigo">
            <span className="font-display font-bold">Astuce.</span> {frenchSpacing(result.piste)}
          </p>
        ) : null}
        <div className="flex flex-col gap-1 px-3 py-2 rounded-t-xs rounded-b-md bg-paper-sunken">
          <span className="text-micro uppercase tracking-micro text-wood-ink-soft">Réponse de référence</span>
          <span className="text-label">{reference}</span>
        </div>
      </div>
    </Scroll>
  )
}

interface ClosedVeilProps {
  // capped : palier étendu atteint, plus de « Continuer aujourd'hui ».
  message: string
  onContinue?: () => void
  continuing?: boolean
}

// Voile de fin de palier (V7-revision, « Journée close ») : le cercle fermé posé
// en tampon vermillon. Le reste de l'écran est rendu inerte par la page.
export function ClosedVeil({ message, onContinue, continuing }: ClosedVeilProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const titleId = useId()

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="veil-in fixed inset-0 z-modal flex flex-col items-center justify-center gap-6 px-9 bg-canvas/80 backdrop-blur-sm text-center"
    >
      <span aria-hidden="true" data-surface="paper" className="seal-stamp size-38 flex items-center justify-center -rotate-8 rounded-blot bg-vermillon shadow-stamp">
        <BrushCircle value={100} label="Cercle fermé" size="stamp" tone="cream" playClose delayMs={950} />
      </span>
      <div className="flex flex-col gap-2 max-w-80">
        <h2 id={titleId} ref={titleRef} tabIndex={-1} className="m-0 font-display text-display-xl outline-none">
          Journée close
        </h2>
        <p className="m-0 text-body-md text-inksoft">{message}</p>
      </div>
      <div className="w-full max-w-80 flex flex-col gap-2">
        <LinkButton to="/dashboard" variant="primary" className="w-full">
          Retour à l’accueil
        </LinkButton>
        {onContinue ? (
          <Button variant="secondary" disabled={continuing} onClick={onContinue} className="w-full">
            Continuer aujourd’hui
          </Button>
        ) : null}
      </div>
    </div>
  )
}
