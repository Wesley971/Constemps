// Mémoire « déjà joué aujourd'hui » des animations qui ne se jouent qu'une fois
// par jour (fermeture des cercles au pinceau, icône de la saison). La clé garde
// la date locale du dernier passage.

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Stockage protégé : navigation privée ou stockage bloqué ne doivent jamais
// casser l'affichage. En cas d'échec de lecture, l'animation est rejouée.
export function playedToday(storageKey: string): boolean {
  try {
    return window.localStorage.getItem(storageKey) === todayKey()
  } catch {
    return false
  }
}

export function rememberPlayedToday(storageKey: string) {
  try {
    window.localStorage.setItem(storageKey, todayKey())
  } catch {
    // Rien à faire : au pire, l'animation sera rejouée à la prochaine vue.
  }
}
