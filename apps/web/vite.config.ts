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
  server: {
    // Test temporaire via tunnel (cloudflared) : Vite bloque par défaut les requêtes
    // dont le Host ne correspond pas à localhost. Le sous-domaine change à chaque
    // lancement de tunnel, d'où le pattern générique plutôt qu'un hôte exact.
    // localhost / 127.0.0.1 restent toujours autorisés par Vite, ceci ne les affecte pas.
    // Voir TUNNEL-TESTING.md à la racine : entrée à supprimer une fois le vrai déploiement en place.
    allowedHosts: ['.trycloudflare.com'],
  },
})
