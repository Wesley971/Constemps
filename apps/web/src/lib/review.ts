import type { ManualRating } from '../types/review'

// Ordre des boutons de notation et touches associées (CON-72) : 1 à 4 de gauche à droite.
export const RATINGS: { rating: ManualRating; key: string; value: number }[] = [
  { rating: 'AGAIN', key: '1', value: 1 },
  { rating: 'HARD', key: '2', value: 2 },
  { rating: 'GOOD', key: '3', value: 3 },
  { rating: 'EASY', key: '4', value: 4 },
]

// Taille du recto sur la carte ronde selon sa longueur : un mot tient en grand,
// une question longue reste dans le cercle.
export function frontSizeClass(text: string, small?: boolean): string {
  const length = text.length
  // Petite carte du retour de l'IA : la question a déjà été lue en grand, une
  // question très longue est limitée à quatre lignes (texte complet dans le DOM).
  if (small) {
    if (length <= 30) return 'text-display-md'
    if (length <= 60) return 'text-body-md font-bold'
    return 'text-label font-bold line-clamp-4'
  }
  if (length <= 14) return 'text-hero-card'
  if (length <= 36) return 'text-display-lg'
  if (length <= 90) return 'text-display-md'
  return 'text-body-lg font-bold'
}
