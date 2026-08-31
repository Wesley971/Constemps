import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: {
        image: 'public/icon-source.png',
      },
      manifest: {
        name: 'Constemps',
        short_name: 'Constemps',
        description: 'App de révision espacée avec évaluation par IA',
        lang: 'fr',
        theme_color: '#33465B',
        background_color: '#F4EEE3',
        display: 'standalone',
      },
    }),
  ],
})
