import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Deck, DeckColor, DeckIcon } from '../types/deck'
import { Button } from '../design-system/components/Button'
import { BrushStroke } from '../design-system/components/BrushStroke'
import { Curtain } from '../design-system/components/Curtain'
import { Input } from '../design-system/components/Input'
import { Label } from '../design-system/components/Label'
import { DeckSymbol, DeckSymbolEcho } from '../design-system/components/DeckSymbol'
import {
  DECK_COLORS,
  DECK_COLOR_BAND,
  DECK_COLOR_LABELS,
  DECK_COLOR_SWATCH,
  DECK_ICONS,
  DECK_ICON_LABELS,
  deckSymbolClass,
  isDeckIcon,
} from '../design-system/constants'

interface DeckFormModalProps {
  deck?: Deck | null
  saving: boolean
  onClose: () => void
  onSubmit: (name: string, color: DeckColor | null, icon: DeckIcon | null) => void
}

const COLOR_CHOICES: { value: DeckColor | null; label: string }[] = [
  { value: null, label: 'Aucune' },
  ...DECK_COLORS.map((c) => ({ value: c, label: DECK_COLOR_LABELS[c] })),
]

// Icônes (CON-92) : « Aucune » puis les 8 symboles, sur deux lignes de 5 cases.
const ICON_CHOICES: { value: DeckIcon | null; label: string }[] = [
  { value: null, label: 'Aucune' },
  ...DECK_ICONS.map((i) => ({ value: i, label: DECK_ICON_LABELS[i] })),
]

// Nouveau deck et modification (CON-70, S18-nouveau-deck) : aperçu de la
// plaquette qui suit la saisie, nom, couleur (fil et liseré de la plaquette),
// icône (symbole à l'encre dans le coin, CON-92).
export function DeckFormModal({ deck, saving, onClose, onSubmit }: DeckFormModalProps) {
  const isEditing = Boolean(deck)
  const [name, setName] = useState(deck?.name ?? '')
  const [color, setColor] = useState<DeckColor | null>(deck?.color ?? null)
  // Une valeur inconnue en base vaut « Aucune ».
  const [icon, setIcon] = useState<DeckIcon | null>(isDeckIcon(deck?.icon) ? deck.icon : null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || saving) return
    onSubmit(name.trim(), color, icon)
  }

  const idle = isEditing ? 'Enregistrer' : 'Créer le deck'
  const busy = isEditing ? 'Enregistrement...' : 'Création...'

  return (
    <Curtain title={isEditing ? 'Modifier le deck' : 'Nouveau deck'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex items-end gap-4">
          <div aria-hidden="true" className="flex flex-col items-center shrink-0 origin-top animate-sway">
            {/* Couleurs de jour : le contenu d'un rideau est le même en jour et en nuit. */}
            <span className={`w-thread h-3 ${color ? DECK_COLOR_SWATCH[color] : 'bg-vermillon'}`} />
            <span
              className={`ema-shape w-23 h-26 pt-6 px-2 pb-2 flex flex-col items-center justify-center bg-wood text-wood-ink text-center ${color ? DECK_COLOR_BAND[color] : ''} ${icon ? 'relative' : ''}`}
            >
              {icon ? <DeckSymbolEcho icon={icon} plaqueWidth={92} className={deckSymbolClass(color)} /> : null}
              <span className={`font-display text-label line-clamp-3 break-words w-full ${icon ? 'relative' : ''}`}>{name.trim() || 'Nouveau deck'}</span>
            </span>
          </div>
          <Input label="Nom du deck" value={name} onChange={(e) => setName(e.target.value)} required disabled={saving} className="flex-1 min-w-0" />
        </div>

        <fieldset className="m-0 p-0 border-none min-w-0 flex flex-col gap-2" disabled={saving}>
          <legend className="p-0 mb-2">
            <Label>Couleur</Label>
          </legend>
          <div className="flex justify-between">
            {COLOR_CHOICES.map((choice) => {
              const checked = choice.value === color
              return (
                <label
                  key={choice.label}
                  className={`flex flex-col items-center gap-1 py-1 min-w-hit text-micro cursor-pointer ${checked ? 'font-bold text-ink' : 'font-normal text-inksoft'}`}
                >
                  <input
                    type="radio"
                    name="deck-color"
                    checked={checked}
                    onChange={() => setColor(choice.value)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`w-8 h-9 rounded-t-xs rounded-b-md peer-focus-visible:shadow-focus-ring ${
                      choice.value ? `${DECK_COLOR_SWATCH[choice.value]} ring-2 ring-inset ring-line` : 'border-2 border-dashed border-line'
                    }`}
                  />
                  {choice.label}
                  {/* Trait sous la couleur choisie, place réservée pour les autres. */}
                  <span className={checked ? '' : 'invisible'}>
                    <BrushStroke tone="current" className="w-8 h-1 text-ink" />
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="m-0 p-0 border-none min-w-0 flex flex-col gap-2" disabled={saving}>
          <legend className="p-0 mb-2">
            <Label>Icône</Label>
          </legend>
          {/* Seconde ligne (Idée à Art) sous les 4 premiers symboles, « Aucune » seule en tête. */}
          <div className="grid grid-cols-5 gap-y-2 justify-items-center">
            {ICON_CHOICES.map((choice) => {
              const checked = choice.value === icon
              return (
                <label
                  key={choice.label}
                  className={`flex flex-col items-center gap-1 py-1 min-w-hit text-micro cursor-pointer ${choice.value === DECK_ICONS[4] ? 'col-start-2' : ''} ${checked ? 'font-bold text-ink' : 'font-normal text-inksoft'}`}
                >
                  <input
                    type="radio"
                    name="deck-icon"
                    checked={checked}
                    onChange={() => setIcon(choice.value)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`w-8 h-9 flex items-center justify-center rounded-t-xs rounded-b-md peer-focus-visible:shadow-focus-ring ${
                      choice.value ? 'ring-2 ring-inset ring-line' : 'border-2 border-dashed border-line'
                    }`}
                  >
                    {choice.value ? <DeckSymbol icon={choice.value} size={20} strokeWidth={1.8} /> : null}
                  </span>
                  {choice.label}
                  {/* Trait sous l'icône choisie, place réservée pour les autres. */}
                  <span className={checked ? '' : 'invisible'}>
                    <BrushStroke tone="current" className="w-8 h-1 text-ink" />
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <Button type="submit" variant="curtain" disabled={!name.trim() || saving} className="w-full">
          <span className="grid">
            <span className={`col-start-1 row-start-1 ${saving ? 'invisible' : ''}`}>{idle}</span>
            <span className={`col-start-1 row-start-1 ${saving ? '' : 'invisible'}`}>{busy}</span>
          </span>
        </Button>
      </form>
    </Curtain>
  )
}
