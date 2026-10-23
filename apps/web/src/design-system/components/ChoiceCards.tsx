import { Label } from './Label'

export interface Choice<T extends string> {
  value: T
  label: string
  help?: string
}

interface ChoiceCardsProps<T extends string> {
  // Nom du groupe de boutons radio (un par formulaire).
  name: string
  // Intitulé du choix : étiquette visible et nom du groupe pour les lecteurs d'écran.
  legend: string
  options: Choice<T>[]
  value: T
  onChange: (value: T) => void
  // cards : cartes côte à côte (S18-ajout) ; list : lignes à case (S18-generer).
  layout?: 'cards' | 'list'
  // Étiquette masquée quand le contexte suffit (type de carte sous le titre).
  hideLegend?: boolean
  disabled?: boolean
}

// Choix unique (CON-70) : de vrais boutons radio, masqués sous leur habillage,
// pour garder la navigation native au clavier (flèches, un seul arrêt de tabulation).
export function ChoiceCards<T extends string>({ name, legend, options, value, onChange, layout = 'cards', hideLegend, disabled }: ChoiceCardsProps<T>) {
  return (
    <fieldset className={`m-0 p-0 border-none min-w-0 flex flex-col gap-2 ${disabled ? 'opacity-50' : ''}`} disabled={disabled}>
      <legend className={hideLegend ? 'sr-only' : 'p-0 mb-2'}>
        <Label>{legend}</Label>
      </legend>
      <div className={layout === 'cards' ? 'flex gap-2' : 'flex flex-col'}>
        {options.map((option) => {
          const checked = option.value === value
          const input = (
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
          )
          const text = (
            <span className="flex flex-col gap-1 min-w-0">
              <span className="font-display text-body-md font-bold">{option.label}</span>
              {option.help ? <span className="text-caption text-inksoft">{option.help}</span> : null}
            </span>
          )

          if (layout === 'cards') {
            return (
              <label
                key={option.value}
                className={`flex-1 min-w-0 flex p-3 pb-4 rounded-t-xs rounded-b-md text-ink cursor-pointer has-[:focus-visible]:shadow-focus-ring ${
                  checked ? 'bg-indigo-tint ring-2 ring-inset ring-indigo' : 'ring-1 ring-inset ring-line'
                }`}
              >
                {input}
                {text}
              </label>
            )
          }
          return (
            <label key={option.value} className="flex items-start gap-3 py-2 min-h-hit text-ink cursor-pointer">
              {input}
              <span
                aria-hidden="true"
                className={`size-6 shrink-0 rounded-xs flex items-center justify-center -rotate-3 peer-focus-visible:shadow-focus-ring ${
                  checked ? 'bg-vermillon text-on-accent' : 'border-2 border-line'
                }`}
              >
                {checked ? (
                  <svg viewBox="0 0 24 24" className="size-3">
                    <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </span>
              {text}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
