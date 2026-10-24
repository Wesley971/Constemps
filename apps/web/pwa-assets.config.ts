import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Icônes de l'app (CON-65), générées une fois depuis le SVG maître par
// `npm run generate-pwa-assets`, puis commitées dans public/. Le maître a un fond
// plein bord à bord et son dessin est déjà dans la zone sûre maskable (cercle de
// 40 %) : aucune marge ajoutée, sinon l'outil rétrécit l'icône et pose un fond
// blanc sous l'icône Apple. Les icônes « any » (pwa-*.png) sont ensuite refaites
// en tuile arrondie avec marge par scripts/round-pwa-icons.mjs, enchaîné dans le
// même script npm.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
    apple: { ...minimal2023Preset.apple, padding: 0 },
  },
  images: ['public/favicon.svg'],
})
