import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { cardsApi, translationApi, ApiError } from '../services/api'
import type { Card as CardData, CardType } from '../types/card'
import type { TranslationResult } from '../types/translation'
import { Button } from '../design-system/components/Button'
import { ChoiceCards } from '../design-system/components/ChoiceCards'
import { Curtain } from '../design-system/components/Curtain'
import { Input } from '../design-system/components/Input'
import { Label } from '../design-system/components/Label'
import type { ToastState } from '../design-system/useToast'
import { CARD_TYPE_HELP, CARD_TYPE_LABELS } from '../design-system/constants'
import { EXAMPLE_MESSAGE, isValidExample, normalizeExample } from '../lib/card'
import { languageLabel } from '../lib/profile'

const FIELD_LABELS: Record<CardType, { front: string; back: string }> = {
  CLASSIC: { front: 'Recto', back: 'Verso' },
  OPEN_QUESTION: { front: 'Question', back: 'Réponse de référence' },
}

const TYPE_OPTIONS = (['CLASSIC', 'OPEN_QUESTION'] as const).map((type) => ({
  value: type,
  label: CARD_TYPE_LABELS[type],
  help: CARD_TYPE_HELP[type],
}))

// Dernière traduction appliquée au verso, gardée avec le recto qui l'a produite :
// le bouton "Inverser" et la ligne d'aide n'ont de sens que tant que ce recto
// est inchangé, aucune persistance au-delà de la carte en cours.
interface AppliedTranslation extends TranslationResult {
  front: string
}

interface CardFormCurtainProps {
  deckId: string
  // Présente : modification de cette carte. Absente : nouvelle carte.
  card?: CardData | null
  onClose: () => void
  onSaved: (card: CardData) => void
  notify: (toast: ToastState) => void
}

// Nouvelle carte et modification (CON-70, S18-ajout), même formulaire. Le type
// n'est choisi qu'à la création : l'API ne permet pas de le changer ensuite.
export function CardFormCurtain({ deckId, card, onClose, onSaved, notify }: CardFormCurtainProps) {
  const isEditing = Boolean(card)
  const [type, setType] = useState<CardType>(card?.type ?? 'CLASSIC')
  const [front, setFront] = useState(card?.front ?? '')
  const [back, setBack] = useState(card?.back ?? '')
  const [example, setExample] = useState(card?.example ?? '')
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [appliedTranslation, setAppliedTranslation] = useState<AppliedTranslation | null>(null)
  // Recto courant lisible après un await, pour ignorer une traduction revenue
  // alors que l'utilisateur a déjà modifié le recto.
  const latestFrontRef = useRef(front)
  latestFrontRef.current = front

  // Phrase d'exemple facultative (CON-77) : mêmes règles que l'API.
  const normalizedExample = normalizeExample(example)
  const exampleError = isValidExample(normalizedExample) ? undefined : EXAMPLE_MESSAGE

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!front.trim() || !back.trim() || exampleError || saving) return

    setSaving(true)
    try {
      const saved = card
        ? await cardsApi.update(card.id, front.trim(), back.trim(), normalizedExample)
        : await cardsApi.create(deckId, type, front.trim(), back.trim(), normalizedExample)
      onSaved(saved)
    } catch (err) {
      notify({
        tone: 'danger',
        title: isEditing ? 'Modification impossible' : 'Création impossible',
        message: err instanceof ApiError ? err.message : isEditing ? 'Impossible de modifier la carte' : 'Impossible de créer la carte',
      })
      setSaving(false)
    }
  }

  // forceSourceIsFrench absent : détection automatique côté back. Présent : bouton
  // "Inverser", qui impose le verdict opposé à celui de la traduction affichée.
  async function handleTranslate(forceSourceIsFrench?: boolean) {
    const text = front.trim()
    if (!text) return

    setTranslating(true)
    try {
      const result = await translationApi.translate(text, forceSourceIsFrench)
      if (latestFrontRef.current.trim() !== text) return
      setBack(result.translation)
      setAppliedTranslation({ ...result, front: text })
    } catch (err) {
      notify({ tone: 'danger', title: 'Traduction indisponible', message: err instanceof ApiError ? err.message : 'Réessaie plus tard.' })
    } finally {
      setTranslating(false)
    }
  }

  // Dérivés plutôt que remis à zéro à la main : modifier le recto masque le bouton
  // "Inverser" et la ligne d'aide, modifier le verso masque la ligne d'aide, qui ne
  // décrirait plus le contenu affiché.
  const translationForFront = appliedTranslation?.front === front.trim() ? appliedTranslation : null
  const translationHint =
    translationForFront && back === translationForFront.translation
      ? `Traduction ${languageLabel(translationForFront.sourceLang)} → ${languageLabel(translationForFront.targetLang)}`
      : null

  const idle = isEditing ? 'Enregistrer' : 'Créer la carte'
  const busy = isEditing ? 'Enregistrement...' : 'Création...'

  return (
    <Curtain title={isEditing ? 'Modifier la carte' : 'Nouvelle carte'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <Label>Type de carte</Label>
            <span className="font-display text-body-md font-bold">{CARD_TYPE_LABELS[type]}</span>
          </div>
        ) : (
          <ChoiceCards name="card-type" legend="Type de carte" hideLegend options={TYPE_OPTIONS} value={type} onChange={setType} disabled={saving} />
        )}

        <Input label={FIELD_LABELS[type].front} value={front} onChange={(e) => setFront(e.target.value)} required disabled={saving} />

        <div className="flex flex-col gap-1">
          <Input label={FIELD_LABELS[type].back} value={back} onChange={(e) => setBack(e.target.value)} required disabled={saving} />
          {type === 'CLASSIC' && (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="curtain-secondary" disabled={saving || translating || !front.trim()} onClick={() => handleTranslate()}>
                {/* Les deux libellés sont superposés dans la même cellule de grille : le bouton
                    prend la largeur du plus long et ne bouge plus quand l'état change.
                    invisible retire le libellé masqué des lecteurs d'écran. */}
                <span className="grid">
                  <span className={`col-start-1 row-start-1 ${translating ? 'invisible' : ''}`}>Traduire</span>
                  <span className={`col-start-1 row-start-1 ${translating ? '' : 'invisible'}`}>Traduction...</span>
                </span>
              </Button>
              {/* Toujours monté, masqué par visibility:hidden tant qu'il ne s'applique pas :
                  son apparition ne doit pas décaler "Traduire".
                  invisible le retire aussi du clavier et des lecteurs d'écran. */}
              <Button
                type="button"
                variant="curtain-secondary"
                icon="ph:arrows-left-right-bold"
                disabled={saving || translating || !translationForFront}
                onClick={() => translationForFront && handleTranslate(!translationForFront.sourceIsFrench)}
                className={translationForFront ? '' : 'invisible'}
              >
                Inverser
              </Button>
            </div>
          )}
          {type === 'CLASSIC' && (
            // Toujours monté, avec sa hauteur réservée par une espace insécable quand il
            // est vide : une région aria-live doit exister avant que son contenu change
            // pour être annoncée, et son apparition ne doit pas décaler le bouton de création.
            <p aria-live="polite" className="m-0 font-body text-caption text-inksoft">
              {translationHint ?? ' '}
            </p>
          )}
        </div>

        {/* Montrée en révision avec le verso, jamais au recto (CON-77). */}
        <Input label="Exemple (facultatif)" value={example} onChange={(e) => setExample(e.target.value)} error={exampleError} disabled={saving} />

        <Button type="submit" variant="curtain" disabled={saving || !front.trim() || !back.trim() || Boolean(exampleError)} className="w-full">
          <span className="grid">
            <span className={`col-start-1 row-start-1 ${saving ? 'invisible' : ''}`}>{idle}</span>
            <span className={`col-start-1 row-start-1 ${saving ? '' : 'invisible'}`}>{busy}</span>
          </span>
        </Button>
      </form>
    </Curtain>
  )
}
