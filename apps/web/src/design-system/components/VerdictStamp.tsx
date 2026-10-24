import type { AiVerdict } from '../../types/review'
import { VERDICT_LABELS } from '../constants'

// Couleurs du tampon (S15-retour-ia), contraste du texte crème mesuré en AA
// (15 px gras, seuil 4,5:1) : succès 4,88, sable foncé 5,36, terracotta 6,26.
const tones: Record<AiVerdict, string> = {
  compris: 'bg-success shadow-stamp-success',
  partiellement: 'bg-warning-deep shadow-stamp-warning',
  incompris: 'bg-danger shadow-stamp-danger',
}

// Verdict de l'IA posé en tampon sous la carte ronde (CON-72). Sans verdict
// (réponse de l'IA inexploitable), tampon indigo neutre.
export function VerdictStamp({ verdict }: { verdict: AiVerdict | null }) {
  return (
    <p
      data-surface="paper"
      className={`seal-stamp m-0 -rotate-3 px-4 py-1 rounded-verdict font-display text-display-sm text-on-accent ${verdict ? tones[verdict] : 'bg-indigo shadow-stamp-indigo'}`}
    >
      {verdict ? VERDICT_LABELS[verdict] : 'Verdict indisponible'}
    </p>
  )
}
