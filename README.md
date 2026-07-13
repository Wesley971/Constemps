# Constemps

App web de révision espacée (flashcards) avec moteur FSRS. Voir `CLAUDE.md` pour le contexte produit complet.

## Structure du monorepo

```
apps/
  api/   Back NestJS + Prisma + MySQL
  web/   Front React + Vite + TypeScript
docker-compose.yml   Service MySQL local
```

## Prérequis

- Node.js 20+
- Docker (pour la base MySQL locale)

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
