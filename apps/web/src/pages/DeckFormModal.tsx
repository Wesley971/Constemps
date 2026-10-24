import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Deck, DeckColor } from '../types/deck'
import { Button } from '../design-system/components/Button'
import { BrushStroke } from '../design-system/components/BrushStroke'
import { Curtain } from '../design-system/components/Curtain'
import { Input } from '../design-system/components/Input'
import { Label } from '../design-system/components/Label'
import { DECK_COLORS, DECK_COLOR_BAND, DECK_COLOR_LABELS, DECK_COLOR_SWATCH } from '../design-system/constants'

interface DeckFormModalProps {
  deck?: Deck | null
  saving: boolean
  onClose: () => void
  // L'icône n'est plus choisie (CON-70) : l'appelant garde celle déjà en base.
  onSubmit: (name: string, color: DeckColor | null) => void
}

const COLOR_CHOICES: { value: DeckColor | null; label: string }[] = [
  { value: null, label: 'Aucune' },
  ...DECK_COLORS.map((c) => ({ value: c, label: DECK_COLOR_LABELS[c] })),
]

// Nouveau deck et modification (CON-70, S18-nouveau-deck) : aperçu de la
// plaquette qui suit la saisie, nom, couleur (fil et liseré de la plaquette).
export function DeckFormModal({ deck, saving, onClose, onSubmit }: DeckFormModalProps) {
  const isEditing = Boolean(deck)
  const [name, setName] = useState(deck?.name ?? '')
  const [color, setColor] = useState<DeckColor | null>(deck?.color ?? null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || saving) return
    onSubmit(name.trim(), color)
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
              className={`ema-shape w-23 h-26 pt-6 px-2 pb-2 flex flex-col items-center justify-center bg-wood text-wood-ink text-center ${color ? DECK_COLOR_BAND[color] : ''}`}
            >
              <span className="font-display text-label line-clamp-3 break-words w-full">{name.trim() || 'Nouveau deck'}</span>
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
