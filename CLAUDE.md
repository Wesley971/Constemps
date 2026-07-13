# Projet : App de révision espacée (nom à définir)

## Vision produit

App web de flashcards façon Anki, avec deux priorités non négociables :

1. **Régularité protégée** : petites sessions quotidiennes plutôt que gros pics isolés suivis d'abandon. L'app doit **empêcher activement le cram**, pas l'encourager.
2. **Vraie compréhension, pas mémorisation brute** : contrairement à Anki (rappel pur) et Duolingo (exercices superficiels, streak comme fin en soi), l'app doit détecter si l'utilisateur a réellement compris un concept.

## Origine et usage réel

Projet né d'un besoin personnel : apprentissage de l'anglais avec un prof aux méthodes pédagogiques exigeantes, envie d'un outil qui applique ce niveau d'exigence. Usage v0 : Wesley et sa femme Emilie comme testeurs réels. Double vocation : outil perso ET portfolio/produit potentiel.

## Stack

- **v0 : web uniquement**, pas mobile (envisagé plus tard si l'usage valide le concept)
- Front : React + Vite
- Back : NestJS + Prisma
- DB : MySQL
- Auth : email/mot de passe, JWT avec cookie httpOnly. Pas de vérification email ni mot de passe oublié en v0.
- Moteur de répétition espacée : **FSRS** (Free Spaced Repetition Scheduler) via la lib `ts-fsrs` (npm), plus moderne et adaptatif que le SM-2 d'Anki

## Principes UX non négociables

Ces règles priment sur toute simplification technique. Ne pas les casser pour aller plus vite.

- **Palier quotidien adaptatif, par deck** (pas de palier global). Apprendre 2 sujets en parallèle ne doit pas pénaliser l'un des deux.
- **Blocage strict après le palier atteint sur un deck**, imposé et non contournable côté UI. Message positif, jamais punitif. Le blocage ne touche QUE la révision de ce deck précis : la création de fiches, la consultation des stats et les autres decks restent accessibles.
- **Pas de culpabilisation sur le retard.** Si l'utilisateur rate plusieurs jours, le palier du jour reste normal. Pas d'accumulation punitive des cartes en retard.
- **Streak secondaire, jamais dominant.** La rétention réelle et la maîtrise des cartes passent devant visuellement. Objectif : éviter l'anti-pattern Duolingo ("je fais l'exercice juste pour ne pas casser la chaîne").
- **Mécanisme de preuve de progression** : ressortir périodiquement (fréquence mensuelle, pas en continu) une carte difficile d'il y a plusieurs mois, avec la réponse d'époque affichée à côté de la réponse actuelle. Implique de conserver le contenu réel des réponses dans l'historique, pas juste un score.

## Types de fiches (MVP)

Deux types seulement pour le MVP :

1. **Rappel classique** : recto/verso, notation manuelle Again/Hard/Good/Easy (comme Anki)
2. **Question ouverte** : champ question + champ réponse de référence en texte libre (pas de checklist structurée). La réponse de l'utilisateur est évaluée par une IA (appel API type Claude) qui rend un verdict (compris/partiellement/incompris) remplaçant la notation manuelle et alimentant FSRS.

Formats avancés (mise en contexte, détection d'erreur) : repoussés en V2, mais le modèle de données doit prévoir un champ `type` extensible dès le départ (voir modèle Prisma ci-dessous).

Audio : génération TTS **à la volée** sur les fiches (prononciation), pas d'upload manuel de fichier audio.

## Scope MVP

- **UC1** : compte simple (email/mot de passe, JWT httpOnly)
- **UC2** : decks plats (pas de hiérarchie/sous-decks), nom libre, un deck = un sujet
- **UC3** : création/édition/suppression de fiches, choix du type à la création, génération audio à la demande
- **UC4** : session de révision avec palier adaptatif par deck, blocage anti-cram
- **UC5** : stats de rétention/maîtrise, streak secondaire, mécanisme de progression mensuel

## Hors scope MVP (V2)

- UC6 : import de decks Anki (.apkg = zip contenant une base SQLite, faisable via `better-sqlite3` ou `sql.js`)
- UC7 : génération automatique de fiches depuis texte/PDF (voire vidéo, encore plus tard)
- Formats de cartes avancés (contexte, détection d'erreur)
- Mécanismes de rappel/notification pour la régularité (rien prévu en v0)

## Modèle de données Prisma (base de départ)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  decks     Deck[]
}

model Deck {
  id        String   @id @default(uuid())
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  dailyGoal Int      @default(10) // palier adaptatif, recalculé par job
  cards     Card[]
  createdAt DateTime @default(now())
}

enum CardType {
  CLASSIC
  OPEN_QUESTION
}

model Card {
  id          String    @id @default(uuid())
  deckId      String
  deck        Deck      @relation(fields: [deckId], references: [id])
  type        CardType
  front       String    // recto, ou question
  back        String    // verso, ou réponse de référence
  // état FSRS
  stability   Float     @default(0)
  difficulty  Float     @default(0)
  due         DateTime  @default(now())
  lapses      Int       @default(0)
  reps        Int       @default(0)
  state       Int       @default(0) // New/Learning/Review/Relearning (enum FSRS)
  audioUrl    String?
  createdAt   DateTime  @default(now())
  reviewLogs  ReviewLog[]
}

model ReviewLog {
  id            String   @id @default(uuid())
  cardId        String
  card          Card     @relation(fields: [cardId], references: [id])
  rating        Int      // Again/Hard/Good/Easy, ou verdict IA mappé
  userAnswer    String?  // contenu réel, nécessaire pour le rappel à 6 mois
  aiVerdict     String?  // pour OPEN_QUESTION : compris/partiel/incompris
  reviewedAt    DateTime @default(now())
  scheduledDays Int
  elapsedDays   Int
}
```

Le champ `type` sur `Card` suffit pour l'extensibilité V2 (ajout de valeurs à l'enum + adaptation front). Pas de table polymorphe pour un MVP à 2 types.

## Points techniques à trancher pendant le dev

### Évaluation IA des questions ouvertes (point le plus risqué du MVP)

- Sortie **forcée en JSON** (verdict + justification courte optionnelle) pour mapper direct sur un rating FSRS
- Gérer la latence dans l'UX de révision : ne pas bloquer l'utilisateur sur un spinner. Soit préaffichage de la suite de session avec verdict patché en async, soit état de chargement clair et assumé.

### Palier adaptatif

Démarrer simple : moyenne mobile sur les 7 derniers jours de reviews réussies par deck. Ne pas sur-ingénierer avant d'avoir de la donnée réelle d'usage (Wesley + Emilie).

### TTS

Google Cloud TTS pour la v0 (gratuit/quasi-gratuit, suffisant pour tester). Isoler l'appel derrière un service dédié pour pouvoir switcher vers ElevenLabs plus tard sans douleur si le besoin de qualité de prononciation augmente (pertinent vu l'usage anglais).

## Conventions de travail

- Stack de référence Wesley : TypeScript, React (hooks, state, React Router), NestJS (lifecycle, Guards, Interceptors, Filters), Prisma, MySQL, Docker, JWT, Zustand/TanStack Query si besoin de state complexe côté front
- Pas de tirets longs (—) dans les textes en français (commentaires, messages UI, docs)
- Méthodologie : découpage par UC, commits atomiques, review avant merge
