# Constemps

App web de révision espacée (flashcards) avec moteur FSRS. Voir `CLAUDE.md` pour le contexte produit complet.

## Structure du monorepo

```
apps/
  api/   Back NestJS + Prisma + MySQL
  web/   Front React + Vite + TypeScript
package.json         Orchestration racine (concurrently), pas un workspace npm
docker-compose.yml   Service MySQL local
```

`apps/api` et `apps/web` restent deux installations indépendantes (chacune son `node_modules`). Le `package.json` racine ne fait qu'orchestrer leur lancement en une seule commande, voir ci-dessous.

## Prérequis

- Node.js 20+
- Docker (pour la base MySQL locale)

## Tout lancer en une commande

Après avoir installé les dépendances une première fois dans chaque app (`npm install` dans `apps/api` et `apps/web`, voir sections détaillées ci-dessous) :

```bash
npm install   # une seule fois, à la racine (installe concurrently)
npm run dev
```

Cette commande démarre Docker (`docker compose up -d`, sans effet si déjà lancé), puis l'API et le front en parallèle, avec leurs logs préfixés `API`/`WEB` dans le même terminal. `Ctrl+C` arrête l'API et le front (Docker continue de tourner en arrière-plan, comme avec un `docker compose up -d` classique).

## Lancer la base de données

Depuis la racine du projet :

```bash
docker compose up -d
```

Démarre un MySQL 8.4 local, base `constemps`, exposé sur `localhost:3306`.

## Lancer l'API (apps/api)

```bash
cd apps/api
npm install
npx prisma migrate dev
npm run start:dev
```

L'API démarre par défaut sur `http://localhost:3000`.

Variables d'environnement : voir `apps/api/.env` (`DATABASE_URL`).

## Lancer le front (apps/web)

```bash
cd apps/web
npm install
npm run dev
```

Le front démarre par défaut sur `http://localhost:5173`.

## Base de données

Le schéma Prisma se trouve dans `apps/api/prisma/schema.prisma`. Après toute modification :

```bash
cd apps/api
npx prisma migrate dev --name <nom_de_la_migration>
```
