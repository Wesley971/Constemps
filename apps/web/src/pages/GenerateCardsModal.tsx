import { useState } from 'react'
import { cardsApi, ApiError } from '../services/api'
import type { Card as CardData, GeneratedCard } from '../types/card'
import type { ToastState } from '../design-system/useToast'
import { Card } from '../design-system/components/Card'
import { Badge } from '../design-system/components/Badge'
import { Button } from '../design-system/components/Button'
import { Input } from '../design-system/components/Input'
import { Textarea } from '../design-system/components/Textarea'
import { Checkbox } from '../design-system/components/Checkbox'
import { IconCircleButton } from '../design-system/components/IconCircleButton'
import { Skeleton } from '../design-system/components/Skeleton'
import { ModalScrim } from '../design-system/components/Modal'

const MAX_TEXT_LENGTH = 50000

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

  const selectedCount = proposals?.filter((p) => p.selected).length ?? 0
  const overLimit = sourceText.length > MAX_TEXT_LENGTH

  async function handleGenerate() {
    if (!sourceText.trim() || overLimit) return

    setGenerating(true)
    try {
      const generated = await cardsApi.generate(deckId, sourceText.trim())
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
        style={{
          position: 'relative',
          width: 680,
          maxWidth: '92vw',
          maxHeight: '88vh',
          background: 'var(--white)',
          borderRadius: 'var(--radius-modal)',
          boxShadow: 'var(--elevation-4)',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ font: 'var(--text-display-sm)', color: 'var(--ink)' }}>Générer des cards depuis un texte</span>
          <IconCircleButton icon="ph:x-bold" tone="ghost" size={32} onClick={onClose} />
        </div>

        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                <div
                  style={{
                    textAlign: 'right',
                    font: 'var(--text-caption)',
                    color: overLimit ? 'var(--danger)' : 'var(--inksoft)',
                    marginTop: 4,
                  }}
                >
                  {sourceText.length.toLocaleString('fr-FR')} / {MAX_TEXT_LENGTH.toLocaleString('fr-FR')}
                </div>
              </div>

              {generating ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', padding: '12px 0' }}>
                  <Skeleton width={200} height={28} radius="var(--radius-pill)" />
                  <span style={{ font: 'var(--text-body-sm)', color: 'var(--inksoft)' }}>Génération en cours...</span>
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
                <p style={{ font: 'var(--text-body-md)', color: 'var(--inksoft)' }}>Aucune proposition restante.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {proposals.map((p) => (
                    <Card key={p.id} style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ paddingTop: 6 }}>
                          <Checkbox checked={p.selected} onChange={(checked) => updateProposal(p.id, { selected: checked })} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Badge tone={p.type === 'CLASSIC' ? 'neutral' : 'teal'}>
                              {p.type === 'CLASSIC' ? 'Rappel classique' : 'Question ouverte'}
                            </Badge>
                            <IconCircleButton icon="ph:trash-bold" tone="ghost" size={28} title="Retirer" onClick={() => removeProposal(p.id)} />
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

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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
