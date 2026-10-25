// Échelle de l'interface sur écran ultra large (CON-75, S24-ultralarge) : jusqu'à
// 1440px de large, rien ne change ; au-delà, toute la page grandit avec la largeur
// (zoom CSS sur <html>), de façon continue, jusqu'à x1,75 à 3440px. Le facteur ne
// dépasse jamais la hauteur divisée par 800 : une fenêtre très large mais basse
// garde au moins 800px de mise en page en hauteur.
// Même formule que le script en ligne de index.html, qui la pose avant le premier
// rendu : toute modification se reporte des deux côtés.
const FROM_WIDTH = 1440
const SPAN = 2000
const GAIN = 0.75
const MAX_SCALE = 1.75
const MIN_LAYOUT_HEIGHT = 800

export function uiScaleFor(width: number, height: number): number {
  if (width <= FROM_WIDTH) return 1
  const byWidth = 1 + (GAIN * (width - FROM_WIDTH)) / SPAN
  const scale = Math.min(byWidth, MAX_SCALE, Math.max(1, height / MIN_LAYOUT_HEIGHT))
  return Math.round(scale * 1000) / 1000
}

// Pose le facteur sur <html> : zoom et --ui-scale (lu par design-system/scale.css).
// Rien n'est posé à 1, ni sans prise en charge de zoom (la page garde sa taille).
export function applyUiScale(): void {
  const root = document.documentElement
  const supported = typeof CSS !== 'undefined' && CSS.supports('zoom', '1')
  const scale = supported ? uiScaleFor(window.innerWidth, window.innerHeight) : 1
  if (scale === 1) {
    root.style.removeProperty('zoom')
    root.style.removeProperty('--ui-scale')
    return
  }
  root.style.setProperty('zoom', String(scale))
  root.style.setProperty('--ui-scale', String(scale))
}
