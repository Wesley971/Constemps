import { useState } from 'react'
import { cardsApi, ApiError } from '../services/api'
import type { Card as CardData, CardType, GeneratedCard } from '../types/card'
import type { ToastState } from '../design-system/useToast'
import { Card } from '../design-system/components/Card'
import { Badge } from '../design-system/components/Badge'
import { Button } from '../design-system/components/Button'
import { Input } from '../design-system/components/Input'
import { Textarea } from '../design-system/components/Textarea'
import { Checkbox } from '../design-system/components/Checkbox'
import { Radio } from '../design-system/components/Radio'
import { IconCircleButton } from '../design-system/components/IconCircleButton'
import { Skeleton } from '../design-system/components/Skeleton'
import { ModalScrim } from '../design-system/components/Modal'
import { CARD_TYPE_LABELS } from '../design-system/constants'

const MAX_TEXT_LENGTH = 50000

type TypeMode = 'auto' | 'forced'

const TYPE_MODE_OPTIONS = [
  { value: 'auto', label: 'Laisser le choix se faire selon le contenu' },
  { value: 'forced', label: 'Choisir un seul type' },
]

const FORCED_TYPE_OPTIONS = [
  { value: 'CLASSIC', label: CARD_TYPE_LABELS.CLASSIC },
  { value: 'OPEN_QUESTION', label: CARD_TYPE_LABELS.OPEN_QUESTION },
]

interface Proposal extends GeneratedCard {
  id: string
  selected: boolean
}

interface GenerateCardsModalProps {
  deckId: string
  onClose: () => void
  onCardsAdded: (cards: CardData[]) => void
  notify: (toast: ToastState) => void
}

export function GenerateCardsModal({ deckId, onClose, onCardsAdded, notify }: GenerateCardsModalProps) {
  const [sourceText, setSourceText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [proposals, setProposals] = useState<Proposal[] | null>(null)
  const [addingSelected, setAddingSelected] = useState(false)
  const [typeMode, setTypeMode] = useState<TypeMode>('auto')
  const [forcedType, setForcedType] = useState<CardType>('CLASSIC')

  const selectedCount = proposals?.filter((p) => p.selected).length ?? 0
  const overLimit = sourceText.length > MAX_TEXT_LENGTH

  async function handleGenerate() {
    if (!sourceText.trim() || overLimit) return

    setGenerating(true)
    try {
      const forceType = typeMode === 'forced' ? forcedType : undefined
      const generated = await cardsApi.generate(deckId, sourceText.trim(), forceType)
      setProposals(generated.map((card, index) => ({ ...card, id: `gen-${index}`, selected: true })))
    } catch (err) {
      notify({
        tone: 'danger',
        title: 'Génération impossible',
        message: err instanceof ApiError ? err.message : 'Impossible de générer des cards depuis ce texte',
      })
    } finally {
      setGenerating(false)
    }
  }

  function updateProposal(id: string, patch: Partial<Proposal>) {
    setProposals((prev) => prev?.map((p) => (p.id === id ? { ...p, ...patch } : p)) ?? null)
  }

  function removeProposal(id: string) {
    setProposals((prev) => prev?.filter((p) => p.id !== id) ?? null)
  }

  async function handleAddSelected() {
    if (!proposals) return
    const selected = proposals.filter((p) => p.selected)
    if (selected.length === 0) return

    setAddingSelected(true)
    const createdCards: CardData[] = []
    try {
      for (const p of selected) {
        const card = await cardsApi.create(deckId, p.type, p.front.trim(), p.back.trim())
        createdCards.push(card)
      }
      onCardsAdded(createdCards)
      notify({ tone: 'success', title: 'Cards ajoutées', message: `${createdCards.length} card(s) ajoutée(s) au deck.` })
      onClose()
    } catch (err) {
      if (createdCards.length > 0) {
        onCardsAdded(createdCards)
      }
      notify({
        tone: 'danger',
        title: 'Ajout incomplet',
        message: `${createdCards.length}/${selected.length} card(s) ajoutée(s). ${err instanceof ApiError ? err.message : 'Une erreur est survenue.'}`,
      })
    } finally {
      setAddingSelected(false)
    }
  }

  return (
    <ModalScrim onScrimClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-170 max-w-[92vw] max-h-[88vh] bg-paper rounded-lg shadow-modal p-7 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <span className="font-display text-display-sm text-ink">Générer des cards depuis un texte</span>
          <IconCircleButton icon="ph:x-bold" tone="ghost" size="md" onClick={onClose} />
        </div>

        <div className="overflow-y-auto flex flex-col gap-4">
          {!proposals ? (
            <>
              <div>
                <Textarea
                  label="Texte source"
                  placeholder="Colle ici un article, un cours, une fiche... l'IA en tirera des cards."
                  rows={10}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  disabled={generating}
                  error={overLimit ? `Le texte dépasse la limite de ${MAX_TEXT_LENGTH.toLocaleString('fr-FR')} caractères` : undefined}
                />
                <div className={`text-right font-body text-caption mt-1 ${overLimit ? 'text-danger' : 'text-inkfaint'}`}>
                  {sourceText.length.toLocaleString('fr-FR')} / {MAX_TEXT_LENGTH.toLocaleString('fr-FR')}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-body text-label text-ink">Type de fiche</span>
                <Radio
                  name="generate-type-mode"
                  options={TYPE_MODE_OPTIONS}
                  value={typeMode}
                  onChange={(value) => setTypeMode(value as TypeMode)}
                  disabled={generating}
                />
                {typeMode === 'forced' && (
                  <Radio
                    name="generate-forced-type"
                    options={FORCED_TYPE_OPTIONS}
                    value={forcedType}
                    onChange={(value) => setForcedType(value as CardType)}
                    disabled={generating}
                    inline
                  />
                )}
              </div>

              {generating ? (
                <div className="flex flex-col gap-2 items-center py-3">
                  <Skeleton className="w-50 h-7" radius="pill" />
                  <span className="font-body text-body-sm text-inksoft">Génération en cours...</span>
                </div>
              ) : (
                <Button disabled={!sourceText.trim() || overLimit} onClick={handleGenerate}>
                  Générer
                </Button>
              )}
            </>
          ) : (
            <>
              {proposals.length === 0 ? (
                <p className="font-body text-body-md text-inksoft">Aucune proposition restante.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {proposals.map((p) => (
                    <Card key={p.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="pt-1.5">
                          <Checkbox checked={p.selected} onChange={(checked) => updateProposal(p.id, { selected: checked })} />
                        </div>
                        <div className="flex-1 flex flex-col gap-2.5">
                          <div className="flex items-center justify-between">
                            <Badge tone={p.type === 'CLASSIC' ? 'neutral' : 'accent'}>{CARD_TYPE_LABELS[p.type]}</Badge>
                            <IconCircleButton icon="ph:trash-bold" tone="ghost" size="sm" title="Retirer" onClick={() => removeProposal(p.id)} />
                          </div>
                          <Input
                            label={p.type === 'CLASSIC' ? 'Recto' : 'Question'}
                            value={p.front}
                            onChange={(e) => updateProposal(p.id, { front: e.target.value })}
                          />
                          <Textarea
                            label={p.type === 'CLASSIC' ? 'Verso' : 'Réponse de référence'}
                            value={p.back}
                            rows={2}
                            onChange={(e) => updateProposal(p.id, { back: e.target.value })}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex gap-2.5 justify-end">
                <Button variant="ghost" disabled={addingSelected} onClick={() => setProposals(null)}>
                  Recommencer
                </Button>
                <Button disabled={selectedCount === 0 || addingSelected} onClick={handleAddSelected}>
                  {addingSelected ? 'Ajout...' : `Ajouter les cards sélectionnées (${selectedCount})`}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </ModalScrim>
  )
}
