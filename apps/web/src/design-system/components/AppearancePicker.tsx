import { APPEARANCES } from '../../lib/appearance'
import type { Appearance } from '../../lib/appearance'
import { useAppearance } from '../useAppearance'
import { BrushStroke } from './BrushStroke'

const LABELS: Record<Appearance, string> = {
  jour: 'Jour',
  nuit: 'Nuit',
  auto: 'Auto',
}

// Blasons ronds de S14-profil, en tokens : le contour suit l'accent (indigo le
// jour, crème la nuit) pour rester lisible sur les deux fonds.
function Blazon({ appearance }: { appearance: Appearance }) {
  return (
    <svg viewBox="0 0 46 46" aria-hidden="true" className="size-12">
      {appearance === 'jour' ? (
        <>
          <circle cx="23" cy="23" r="21" className="fill-paper stroke-indigo" strokeWidth="1.5" />
          <circle cx="23" cy="23" r="10" className="fill-vermillon" />
        </>
      ) : appearance === 'nuit' ? (
        <>
          <circle cx="23" cy="23" r="21" className="fill-noren stroke-indigo" strokeWidth="1.5" />
          <circle cx="21" cy="24" r="10" className="fill-cream" />
          <circle cx="26" cy="20" r="9" className="fill-noren" />
        </>
      ) : (
        <>
          <circle cx="23" cy="23" r="21" className="fill-paper" />
          <path d="M23 2 A21 21 0 0 1 23 44 Z" className="fill-noren" />
          <circle cx="23" cy="23" r="21" fill="none" className="stroke-indigo" strokeWidth="1.5" />
        </>
      )}
    </svg>
  )
}

// Réglage d'apparence (CON-73, S14-profil) : trois blasons Jour / Nuit / Auto,
// de vrais boutons radio pour la navigation au clavier. Le choix s'applique
// tout de suite, sans fondu, et reste sur l'appareil.
export function AppearancePicker() {
  const { appearance, setAppearance } = useAppearance()

  return (
    <fieldset className="m-0 p-0 px-1 border-none min-w-0 flex flex-col gap-2">
      <legend className="p-0 mb-2 font-display text-display-sm">Apparence</legend>
      <div className="flex justify-around">
        {APPEARANCES.map((option) => {
          const checked = option === appearance
          return (
            <label
              key={option}
              className={`flex flex-col items-center gap-2 px-3 py-1 rounded-md cursor-pointer has-[:focus-visible]:shadow-focus-ring ${
                checked ? 'text-ink' : 'text-inksoft'
              }`}
            >
              <input
                type="radio"
                name="appearance"
                value={option}
                checked={checked}
                onChange={() => setAppearance(option)}
                className="sr-only"
              />
              <span className={checked ? '' : 'opacity-75'}>
                <Blazon appearance={option} />
              </span>
              <span className={`text-label ${checked ? 'font-bold' : 'font-medium'}`}>{LABELS[option]}</span>
              {checked ? <BrushStroke key={option} className="w-10 h-2" /> : <span aria-hidden="true" className="h-2" />}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
