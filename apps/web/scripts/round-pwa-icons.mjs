// Icônes « any » du manifeste en tuile arrondie (CON-65), lancé juste après
// pwa-assets-generator par `npm run generate-pwa-assets`. Edge en tire le
// raccourci du bureau et l'icône de la barre des tâches sous Windows : un carré
// plein bord à bord y paraît carré, même arrondi à 18 %. D'où une marge
// transparente de 6,25 % de chaque côté (dessin réduit à 87,5 %, rien de
// redessiné) et des coins arrondis à 30 % de la tuile. La maskable (Android
// découpe lui-même), l'icône Apple (iOS arrondit lui-même) et les favicons
// restent en carré plein.
//
// Le rayon ne touche jamais le dessin, placé dans le cercle de 40 % du maître :
// le script s'arrête en erreur si un pixel du dessin tombe hors de la tuile.
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const MASTER = fileURLToPath(new URL('../public/favicon.svg', import.meta.url))
const ICONS = [
  ['pwa-64x64.png', 64],
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
]
const MARGIN = 0.0625
const RADIUS = 0.3
// Fond plein du maître (#11181E) : tout autre pixel appartient au dessin.
const BACKGROUND = [0x11, 0x18, 0x1e]

for (const [name, size] of ICONS) {
  const tile = Math.round(size * (1 - 2 * MARGIN))
  const r = tile * RADIUS
  // Rendu direct depuis le maître à la taille de la tuile, plus net qu'une
  // réduction du PNG généré.
  const square = await sharp(MASTER, { density: Math.max(72, (72 * tile * 4) / 1024) })
    .resize(tile, tile)
    .ensureAlpha()
    .png()
    .toBuffer()
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}"><rect width="${tile}" height="${tile}" rx="${r}" ry="${r}"/></svg>`,
  )
  const rounded = await sharp(square).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()

  const before = await sharp(square).raw().toBuffer()
  const after = await sharp(rounded).raw().toBuffer()
  for (let i = 0; i < before.length; i += 4) {
    const isDrawing = BACKGROUND.some((value, c) => Math.abs(before[i + c] - value) > 8)
    if (isDrawing && after[i + 3] < 255) {
      throw new Error(`${name} : l'arrondi toucherait le dessin, rayon ou marge à revoir`)
    }
  }

  const offset = Math.round((size - tile) / 2)
  const icon = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: rounded, left: offset, top: offset }])
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(new URL(`../public/${name}`, import.meta.url), icon)
  console.log(`✔ ${name} : tuile de ${tile} px, coins de ${Math.round(r)} px`)
}
