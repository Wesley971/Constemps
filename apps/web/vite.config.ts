import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Test temporaire via tunnel (cloudflared) : Vite bloque par défaut les requêtes
    // dont le Host ne correspond pas à localhost. Le sous-domaine change à chaque
    // lancement de tunnel, d'où le pattern générique plutôt qu'un hôte exact.
    // localhost / 127.0.0.1 restent toujours autorisés par Vite, ceci ne les affecte pas.
    // Voir TUNNEL-TESTING.md à la racine : entrée à supprimer une fois le vrai déploiement en place.
    allowedHosts: ['.trycloudflare.com'],
  },
})
