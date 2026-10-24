import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Icônes générées une fois depuis public/favicon.svg (pwa-assets.config.ts,
      // CON-65) et commitées dans public/.
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Constemps',
        short_name: 'Constemps',
        description: 'App de révision espacée avec évaluation par IA',
        lang: 'fr',
        // Fond jour de la refonte ; meta theme-color suit ensuite le thème actif.
        theme_color: '#F5F1E8',
        background_color: '#F5F1E8',
        display: 'standalone',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
