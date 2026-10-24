// Apparence Jour / Nuit / Auto (CON-73) : choix gardé sur l'appareil, sans
// passer par l'API, pour valoir aussi avant la connexion. Le script en ligne de
// index.html applique le même choix avant le premier rendu : même clé, mêmes
// valeurs, même résolution. Toute modification ici doit y être reportée.

export type Appearance = 'jour' | 'nuit' | 'auto'
export type Theme = 'jour' | 'nuit'

export const APPEARANCES: Appearance[] = ['jour', 'nuit', 'auto']

const STORAGE_KEY = 'constemps.appearance'
const NIGHT_QUERY = '(prefers-color-scheme: dark)'

function isAppearance(value: unknown): value is Appearance {
  return value === 'jour' || value === 'nuit' || value === 'auto'
}

// Stockage protégé : navigation privée, stockage bloqué ou valeur inconnue
// ramènent à Auto, sans jamais casser l'affichage.
export function readAppearance(): Appearance {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isAppearance(stored) ? stored : 'auto'
  } catch {
    return 'auto'
  }
}

function saveAppearance(appearance: Appearance) {
  try {
    window.localStorage.setItem(STORAGE_KEY, appearance)
  } catch {
    // Rien à faire : le choix vaut pour cette visite seulement.
  }
}

function nightQuery(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(NIGHT_QUERY) : null
}

export function resolveTheme(appearance: Appearance): Theme {
  if (appearance === 'auto') return nightQuery()?.matches ? 'nuit' : 'jour'
  return appearance
}

// Pose le thème sur <html> : attribut lu par tokens.css, schéma des contrôles
// natifs, fond du document et couleur de la barre du navigateur.
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme === 'nuit' ? 'dark' : 'light'
  const canvas = getComputedStyle(root).getPropertyValue('--color-canvas').trim()
  if (canvas) {
    root.style.backgroundColor = canvas
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', canvas)
  }
}

// Petit magasin partagé par useAppearance : un seul choix pour toute l'app.
let current: Appearance = readAppearance()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function getAppearance(): Appearance {
  return current
}

export function setAppearance(appearance: Appearance) {
  current = appearance
  saveAppearance(appearance)
  applyTheme(resolveTheme(appearance))
  emit()
}

// Auto suit le système en direct ; un choix fait dans un autre onglet est repris.
let stopWatching: (() => void) | null = null

function watchSystemAndTabs(): () => void {
  const query = nightQuery()
  const onSystemChange = () => {
    if (current === 'auto') applyTheme(resolveTheme('auto'))
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return
    current = readAppearance()
    applyTheme(resolveTheme(current))
    emit()
  }
  query?.addEventListener('change', onSystemChange)
  window.addEventListener('storage', onStorage)
  return () => {
    query?.removeEventListener('change', onSystemChange)
    window.removeEventListener('storage', onStorage)
  }
}

export function subscribeAppearance(listener: () => void): () => void {
  listeners.add(listener)
  stopWatching ??= watchSystemAndTabs()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && stopWatching) {
      stopWatching()
      stopWatching = null
    }
  }
}
