import { useId, useState } from 'react'
import { cardsApi, ApiError } from '../services/api'
import type { Card as CardData, CardType, GeneratedCard } from '../types/card'
import type { ToastState } from '../design-system/useToast'
import { Button } from '../design-system/components/Button'
import { Checkbox } from '../design-system/components/Checkbox'
import { ChoiceCards } from '../design-system/components/ChoiceCards'
import { Curtain } from '../design-system/components/Curtain'
import { IconButton } from '../design-system/components/IconButton'
import { InkRule } from '../design-system/components/InkRule'
import { Input } from '../design-system/components/Input'
import { Label } from '../design-system/components/Label'
import { Textarea } from '../design-system/components/Textarea'
import { CARD_TYPE_LABELS, CARD_TYPE_HELP } from '../design-system/constants'
import { EXAMPLE_MESSAGE, isValidExample, normalizeExample } from '../lib/card'
import { plural } from '../lib/today'

const MAX_TEXT_LENGTH = 50000

// AUTO = « laisser le contenu décider » (comportement par défaut, l'IA choisit
// selon le texte) ; envoyé à l'API comme absence de type forcé.
type TypeChoice = CardType | 'AUTO'

const TYPE_CHOICES: { value: TypeChoice; label: string; help: string }[] = [
  { value: 'AUTO', label: 'Laisser le contenu décider', help: 'L’IA choisit le type le plus adapté.' },
  { value: 'CLASSIC', label: CARD_TYPE_LABELS.CLASSIC, help: CARD_TYPE_HELP.CLASSIC },
  { value: 'OPEN_QUESTION', label: CARD_TYPE_LABELS.OPEN_QUESTION, help: CARD_TYPE_HELP.OPEN_QUESTION },
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

// Génération depuis un texte (CON-70, S18-generer) : texte source sur papier
// quadrillé et type de carte, puis les propositions dans le même rideau.
export function GenerateCardsModal({ deckId, onClose, onCardsAdded, notify }: GenerateCardsModalProps) {
  const sourceId = useId()
  const [sourceText, setSourceText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [proposals, setProposals] = useState<Proposal[] | null>(null)
  const [addingSelected, setAddingSelected] = useState(false)
  const [typeChoice, setTypeChoice] = useState<TypeChoice>('AUTO')

  const selectedCount = proposals?.filter((p) => p.selected).length ?? 0
  // Exemple prérempli par l'IA, modifiable (CON-77) : mêmes règles que le rideau
  // de carte ; une proposition retenue au-delà de la limite bloque l'ajout.
  const exampleOf = (p: Proposal) => normalizeExample(p.example ?? '')
  const hasInvalidExample = proposals?.some((p) => p.selected && !isValidExample(exampleOf(p))) ?? false
  const overLimit = sourceText.length > MAX_TEXT_LENGTH

  async function handleGenerate() {
    if (!sourceText.trim() || overLimit) return

    setGenerating(true)
    try {
      const generated = await cardsApi.generate(deckId, sourceText.trim(), typeChoice === 'AUTO' ? undefined : typeChoice)
      setProposals(generated.map((card, index) => ({ ...card, id: `gen-${index}`, selected: true })))
    } catch (err) {
      notify({
        tone: 'danger',
        title: 'Génération impossible',
        message: err instanceof ApiError ? err.message : 'Impossible de générer des cartes depuis ce texte',
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
        const card = await cardsApi.create(deckId, p.type, p.front.trim(), p.back.trim(), exampleOf(p))
        createdCards.push(card)
      }
      onCardsAdded(createdCards)
      notify({ tone: 'success', title: 'Cartes ajoutées', message: `${createdCards.length} carte(s) ajoutée(s) au deck.` })
      onClose()
    } catch (err) {
      if (createdCards.length > 0) {
        onCardsAdded(createdCards)
      }
      notify({
        tone: 'danger',
        title: 'Ajout incomplet',
        message: `${createdCards.length}/${selected.length} carte(s) ajoutée(s). ${err instanceof ApiError ? err.message : 'Une erreur est survenue.'}`,
      })
    } finally {
      setAddingSelected(false)
    }
  }

  // Libellé court : « Ajouter les cartes sélectionnées (12) » débordait du bouton à 360px.
  const addIdle = `Ajouter ${selectedCount} ${plural(selectedCount, 'carte', 'cartes')}`
  const counterId = `${sourceId}-compteur`

  return (
    <Curtain title={proposals ? 'Propositions' : 'Depuis un texte'} onClose={onClose}>
      {!proposals ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor={sourceId}>Texte source</Label>
            <textarea
              id={sourceId}
              rows={6}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              disabled={generating}
              placeholder="Colle ici un article, un cours, une fiche… l’IA en tirera des cartes."
              aria-describedby={counterId}
              aria-invalid={overLimit ? true : undefined}
              className="genko block w-full py-3 px-4 border-none rounded-xs bg-paper-card font-body text-body-sm leading-6 text-paper-ink resize-y placeholder:text-wood-ink-soft"
            />
            <span id={counterId} className={`self-end text-caption tabular-nums ${overLimit ? 'text-danger' : 'text-inksoft'}`}>
              {overLimit ? 'Trop long : ' : ''}
              {sourceText.length.toLocaleString('fr-FR')} / {MAX_TEXT_LENGTH.toLocaleString('fr-FR')}
            </span>
          </div>

          <ChoiceCards
            name="generation-type"
            legend="Type de carte"
            layout="list"
            options={TYPE_CHOICES}
            value={typeChoice}
            onChange={setTypeChoice}
            disabled={generating}
          />

          <Button variant="curtain" disabled={generating || !sourceText.trim() || overLimit} onClick={handleGenerate} className="w-full">
            <span className="grid">
              <span className={`col-start-1 row-start-1 ${generating ? 'invisible' : ''}`}>Générer</span>
              <span className={`col-start-1 row-start-1 ${generating ? '' : 'invisible'}`}>Génération...</span>
            </span>
          </Button>
        </>
      ) : (
        <>
          {proposals.length === 0 ? (
            <p className="m-0 text-body-md text-inksoft">Aucune proposition restante.</p>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-4">
              {proposals.map((p, index) => (
                <li key={p.id} className="flex flex-col gap-2">
                  {index > 0 ? <InkRule /> : null}
                  <div className="flex items-center justify-between gap-2">
                    <Checkbox
                      checked={p.selected}
                      onChange={(checked) => updateProposal(p.id, { selected: checked })}
                      label={<span className="font-display font-bold">{CARD_TYPE_LABELS[p.type]}</span>}
                    />
                    <IconButton icon="delete" label={`Retirer la proposition « ${p.front} »`} onClick={() => removeProposal(p.id)} />
                  </div>
                  <Input label={p.type === 'CLASSIC' ? 'Recto' : 'Question'} value={p.front} onChange={(e) => updateProposal(p.id, { front: e.target.value })} />
                  <Textarea
                    label={p.type === 'CLASSIC' ? 'Verso' : 'Réponse de référence'}
                    value={p.back}
                    rows={2}
                    onChange={(e) => updateProposal(p.id, { back: e.target.value })}
                  />
                  <Input
                    label="Exemple (facultatif)"
                    value={p.example ?? ''}
                    onChange={(e) => updateProposal(p.id, { example: e.target.value })}
                    error={isValidExample(exampleOf(p)) ? undefined : EXAMPLE_MESSAGE}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-2">
            <Button variant="curtain" disabled={selectedCount === 0 || hasInvalidExample || addingSelected} onClick={handleAddSelected} className="w-full">
              <span className="grid">
                <span className={`col-start-1 row-start-1 ${addingSelected ? 'invisible' : ''}`}>{addIdle}</span>
                <span className={`col-start-1 row-start-1 ${addingSelected ? '' : 'invisible'}`}>Ajout...</span>
              </span>
            </Button>
            <Button variant="curtain-ghost" disabled={addingSelected} onClick={() => setProposals(null)} className="w-full">
              Recommencer
            </Button>
          </div>
        </>
      )}
    </Curtain>
  )
}
