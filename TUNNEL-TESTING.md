# Test temporaire via tunnel (à supprimer après déploiement réel)

Cette procédure permet d'exposer temporairement l'app (front + back) à des testeurs externes via des tunnels Cloudflare (`cloudflared`), sans déploiement réel. Chaque tunnel génère une URL publique éphémère en `*.trycloudflare.com`, valable le temps que le tunnel tourne.

Elle repose sur trois leviers déjà présents dans le code de base (pas de logique temporaire) :

- `VITE_API_URL` (front, `apps/web`) : URL de l'API consommée par le front. Par défaut `http://localhost:3000` si absente.
- `WEB_ORIGIN` (back, `apps/api`) : origine autorisée en CORS. Par défaut `http://localhost:5173` si absente.

Deux éléments sont spécifiques au tunnel et isolés comme tels dans le code :

- `TUNNEL_MODE=true` (back, `apps/api`) : bascule le cookie de session en `sameSite: 'none'` + `secure: true`, requis pour du cross-site (front et back sur deux domaines `trycloudflare.com` différents). Absente, le comportement reste strictement celui d'aujourd'hui (`sameSite: 'lax'`).
- `server.allowedHosts: ['.trycloudflare.com']` (front, `apps/web/vite.config.ts`) : Vite bloque par défaut les requêtes dont le Host ne correspond pas à localhost. Le pattern générique couvre tous les sous-domaines `trycloudflare.com`, qui changent à chaque lancement de tunnel. `localhost` / `127.0.0.1` restent toujours autorisés, ceci ne change rien en usage local normal.

## Prérequis

- `cloudflared` (CLI Cloudflare Tunnel) installé et disponible dans le PATH.
- Le back (`apps/api`) et le front (`apps/web`) fonctionnels en local comme d'habitude.

## Étapes (ordre important)

L'URL du front n'est connue qu'après avoir lancé son tunnel, alors que le back a besoin de cette URL pour son CORS (`WEB_ORIGIN`). Il faut donc démarrer le back une première fois, puis le redémarrer une fois l'URL du front connue.

**1. Terminal A — lancer le back**

```powershell
cd apps/api
npm run start:dev
```

**2. Terminal B — tunnel vers le back**

```powershell
cloudflared tunnel --url http://localhost:3000
```

Note l'URL générée (ex. `https://xxxx-back.trycloudflare.com`) : c'est l'**URL du back**.

**3. Terminal C — configurer et lancer le front avec l'URL du back**

Soit en variable d'environnement directe :

```powershell
$env:VITE_API_URL = "https://xxxx-back.trycloudflare.com"
cd apps/web
npm run dev
```

Soit via un fichier local : copier `apps/web/.env.tunnel.example` vers `apps/web/.env.local` (déjà ignoré par git), y remplacer l'URL, puis lancer `npm run dev` normalement.

**4. Terminal D — tunnel vers le front**

```powershell
cloudflared tunnel --url http://localhost:5173
```

Note l'URL générée (ex. `https://yyyy-front.trycloudflare.com`) : c'est l'**URL du front**, celle à transmettre aux testeurs externes.

**5. Mettre à jour `apps/api/.env` avec l'URL du front, puis redémarrer le back**

`apps/api/.env` est un fichier local, déjà ignoré par git (pas de fuite possible). Ouvrir ce fichier et ajouter (ou modifier si déjà présentes) ces deux lignes, avec l'URL notée à l'étape 4 :

```
WEB_ORIGIN="https://yyyy-front.trycloudflare.com"
TUNNEL_MODE="true"
```

Puis, dans le Terminal A, arrêter le process (Ctrl+C) et relancer :

```powershell
npm run start:dev
```

`WEB_ORIGIN` et `TUNNEL_MODE` sont lus une seule fois au démarrage : toute modification de `.env` exige ce redémarrage pour être prise en compte.

⚠️ **À chaque nouveau lancement de tunnel, l'URL change.** Si le front est relancé (nouveau tunnel Cloudflare), il faut donc refaire cette étape (nouvelle URL dans `WEB_ORIGIN`, redémarrage du back) avant de retester, sinon le CORS bloque silencieusement les requêtes venant du nouveau front.

**6. Vérifier de bout en bout** (inscription, connexion, création de deck) sur l'URL du front avant de la transmettre aux testeurs.

**7. Une fois la session de test terminée**, retirer (ou vider) les lignes `WEB_ORIGIN` et `TUNNEL_MODE` de `apps/api/.env` avant de reprendre le dev local normal : sinon le back continue de n'autoriser en CORS que l'ancienne URL de tunnel, et bloque `http://localhost:5173`.

## Nettoyage une fois le vrai déploiement en place

Quatre choses à supprimer, spécifiques à ce test temporaire :

1. Ce fichier, `TUNNEL-TESTING.md`.
2. `apps/web/.env.tunnel.example`.
3. Le bloc conditionnel `TUNNEL_MODE` dans `apps/api/src/auth/auth.controller.ts` (revenir à un `cookieOptions` unique avec `sameSite: 'lax'` et `secure: process.env.NODE_ENV === 'production'`, sans branche `TUNNEL_MODE`).
4. L'entrée `server.allowedHosts: ['.trycloudflare.com']` dans `apps/web/vite.config.ts` (retirer tout le bloc `server`, ou juste `allowedHosts` s'il sert à autre chose entre-temps).

`VITE_API_URL` et `WEB_ORIGIN` restent : ce sont des variables d'environnement génériques utiles indépendamment du tunnel, pas une logique temporaire.
