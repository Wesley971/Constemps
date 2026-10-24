import { NotificationSeal } from './NotificationSeal'

interface FieldMessageProps {
  id: string
  hint?: string
  error?: string
}

// Ligne de message sous un champ (CON-57), toujours réservée : une erreur qui
// apparaît ne décale rien. Erreur en vermillon avec un petit sceau « ! » (CON-78,
// S19-A-err) ; le vermillon suit le contexte (fond de jour, rideau, nuit).
export function FieldMessage({ id, hint, error }: FieldMessageProps) {
  return (
    <span id={id} className={`flex items-center gap-1 font-body text-caption min-h-4 ${error ? 'text-vermillon' : 'text-inksoft'}`}>
      {error ? <NotificationSeal glyph="alert" size="field" /> : null}
      {error ?? hint ?? ''}
    </span>
  )
}
