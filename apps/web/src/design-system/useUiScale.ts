import { useEffect } from 'react'
import { applyUiScale } from '../lib/uiScale'

// Échelle de l'interface suivie au redimensionnement (CON-75). Le script en ligne
// de index.html l'a déjà posée avant le premier rendu.
export function useUiScale(): void {
  useEffect(() => {
    applyUiScale()
    window.addEventListener('resize', applyUiScale)
    return () => window.removeEventListener('resize', applyUiScale)
  }, [])
}
