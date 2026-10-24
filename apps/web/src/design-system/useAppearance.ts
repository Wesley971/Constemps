import { useSyncExternalStore } from 'react'
import { getAppearance, setAppearance, subscribeAppearance } from '../lib/appearance'

// Choix d'apparence courant (CON-73). Tant qu'un composant l'utilise, Auto suit
// le système en direct et un choix fait dans un autre onglet est repris : App
// l'appelle une fois pour que ce soit vrai sur tous les écrans.
export function useAppearance() {
  const appearance = useSyncExternalStore(subscribeAppearance, getAppearance)
  return { appearance, setAppearance }
}
