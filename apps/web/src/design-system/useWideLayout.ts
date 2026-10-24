import { useSyncExternalStore } from 'react'

// Même seuil que la variante lg: de Tailwind (64rem, soit 1024px) : CSS et
// JavaScript basculent ensemble, zoom et taille de police compris.
const WIDE_QUERY = '(min-width: 64rem)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(WIDE_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getSnapshot() {
  return window.matchMedia(WIDE_QUERY).matches
}

// Mise en page des grands écrans (CON-75, S20-C). À réserver aux changements de
// structure (ordre des blocs, élément déplacé) : le reste passe par lg:. Lu dès
// le premier rendu, sans éclair de la version mobile.
export function useWideLayout(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}
