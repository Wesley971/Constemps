import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Deck, DeckColor, DeckIcon } from '../types/deck'
import { Button } from '../design-system/components/Button'
import { Input } from '../design-system/components/Input'
import { IconCircleButton } from '../design-system/components/IconCircleButton'
import { ModalScrim } from '../design-system/components/Modal'
import { DECK_COLORS, DECK_COLOR_LABELS, DECK_COLOR_SWATCH, DECK_ICONS, DECK_ICON_LABELS } from '../design-system/constants'

interface DeckFormModalProps {
  deck?: Deck | null
  saving: boolean
  onClose: () => void
  onSubmit: (name: string, color: DeckColor | null, icon: DeckIcon | null) => void
}

const swatchButtonBase =
  'inline-flex items-center justify-center min-h-hit min-w-hit rounded-full border-[1.5px] transition-colors duration-base ease-standard focus-visible:shadow-focus-ring'

export function DeckFormModal({ deck, saving, onClose, onSubmit }: DeckFormModalProps) {
  const isEditing = Boolean(deck)
  const [name, setName] = useState(deck?.name ?? '')
  const [color, setColor] = useState<DeckColor | null>(deck?.color ?? null)
  const [icon, setIcon] = useState<DeckIcon | null>(deck?.icon ?? null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim(), color, icon)
  }

  return (
    <ModalScrim onScrimClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-105 max-w-[90vw] max-h-[88vh] overflow-y-auto bg-paper rounded-lg shadow-modal p-7 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <span className="font-display text-display-sm text-ink">{isEditing ? 'Modifier le deck' : 'Créer un deck'}</span>
          <IconCircleButton icon="ph:x-bold" tone="ghost" size="md" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nom du deck" placeholder="Vocabulaire B2" value={name} onChange={(e) => setName(e.target.value)} required disabled={saving} />

          <div className="flex flex-col gap-2">
            <span className="font-body text-label text-ink">Couleur (optionnel)</span>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                title="Aucune couleur"
                aria-pressed={color === null}
                disabled={saving}
                onClick={() => setColor(null)}
                className={`${swatchButtonBase} ${color === null ? 'border-indigo-deep' : 'border-transparent hover:border-line'}`}
              >
                <span className="w-5 h-5 rounded-full border-[1.5px] border-line bg-paper" />
              </button>
              {DECK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={DECK_COLOR_LABELS[c]}
                  aria-pressed={color === c}
                  disabled={saving}
                  onClick={() => setColor(c)}
                  className={`${swatchButtonBase} ${color === c ? 'border-indigo-deep' : 'border-transparent hover:border-line'}`}
                >
                  <span className={`w-5 h-5 rounded-full ${DECK_COLOR_SWATCH[c]}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-body text-label text-ink">Icône (optionnel)</span>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                title="Aucune icône"
                aria-pressed={icon === null}
                disabled={saving}
                onClick={() => setIcon(null)}
                className={`${swatchButtonBase} ${icon === null ? 'border-indigo-deep text-indigo-deep' : 'border-line text-inkfaint hover:bg-paper-sunken'}`}
              >
                <span className="w-4 h-4 rounded-full border-[1.5px] border-line" />
              </button>
              {DECK_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  title={DECK_ICON_LABELS[i]}
                  aria-pressed={icon === i}
                  disabled={saving}
                  onClick={() => setIcon(i)}
                  className={`${swatchButtonBase} ${icon === i ? 'border-indigo-deep bg-indigo-tint text-indigo-deep' : 'border-line text-inksoft hover:bg-paper-sunken'}`}
                >
                  <iconify-icon icon={i} width="18"></iconify-icon>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 justify-end">
            <Button type="button" variant="ghost" disabled={saving} onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? (isEditing ? 'Enregistrement...' : 'Création...') : isEditing ? 'Enregistrer' : 'Créer le deck'}
            </Button>
          </div>
        </form>
      </div>
    </ModalScrim>
  )
}
