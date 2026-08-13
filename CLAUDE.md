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

## Stack confirmée

IA unifiée sur **Gemini** (`@google/genai`) pour l'évaluation des réponses IA et la génération de fiches, remplaçant la piste initialement envisagée ("API type Claude" pour l'évaluation).

`ReviewLog` conserve désormais le feedback pédagogique complet de l'évaluation IA (cePointsForts, cePointsAmeliorer, piste, resumeCourt), pas seulement le verdict, pour permettre une comparaison ancienne/actuelle réellement personnalisée dans le mécanisme "Ta progression".

## Principes UX non négociables

Ces règles priment sur toute simplification technique. Ne pas les casser pour aller plus vite.

- **Palier quotidien adaptatif, par deck** (pas de palier global). Apprendre 2 sujets en parallèle ne doit pas pénaliser l'un des deux.
- **Blocage strict après le palier atteint sur un deck**, imposé et non contournable côté UI. Message positif, jamais punitif. Le blocage ne touche QUE la révision de ce deck précis : la création de fiches, la consultation des stats et les autres decks restent accessibles.
- **Pas de culpabilisation sur le retard.** Si l'utilisateur rate plusieurs jours, le palier du jour reste normal. Pas d'accumulation punitive des cartes en retard.
- **Streak secondaire, jamais dominant.** La rétention réelle et la maîtrise des cartes passent devant visuellement. Objectif : éviter l'anti-pattern Duolingo ("je fais l'exercice juste pour ne pas casser la chaîne").
- **Mécanisme de preuve de progression** : ressortir périodiquement (fréquence mensuelle, pas en continu) une carte difficile d'il y a plusieurs mois, avec la réponse d'époque affichée à côté de la réponse actuelle. Implique de conserver le contenu réel des réponses dans l'historique, pas juste un score.

## Types de fiches (MVP)

Deux types seulement pour le MVP :

1. **Rappel classique** (affiché "Appréciation personnelle" depuis la v1) : recto/verso, notation manuelle Again/Hard/Good/Easy (comme Anki)
2. **Question ouverte** (affiché "Avis assisté" depuis la v1) : champ question + champ réponse de référence en texte libre (pas de checklist structurée). La réponse de l'utilisateur est évaluée par une IA (appel API type Claude) qui rend un verdict (compris/partiellement/incompris) remplaçant la notation manuelle et alimentant FSRS.

Formats avancés (mise en contexte, détection d'erreur) : repoussés en V2, mais le modèle de données doit prévoir un champ `type` extensible dès le départ (voir modèle Prisma ci-dessous).

## Scope MVP

- **UC1** : compte simple (email/mot de passe, JWT httpOnly) ✅ Terminé
- **UC2** : decks plats (pas de hiérarchie/sous-decks), nom libre, un deck = un sujet ✅ Terminé
- **UC3** : création/édition/suppression de fiches, choix du type à la création ✅ Terminé
- **UC4** : session de révision avec palier adaptatif par deck, blocage anti-cram ✅ Terminé
- **UC5** : stats de rétention/maîtrise, streak secondaire, mécanisme de progression mensuel ✅ Terminé

## Hors scope MVP (V2)

- UC6 : import de decks Anki (.apkg = zip contenant une base SQLite, faisable via `better-sqlite3` ou `sql.js`)
- UC7 : génération automatique de fiches depuis texte/PDF (voire vidéo, encore plus tard). ✅ Terminé pour le texte, implémenté en avance sur le plan initial (PDF et vidéo restent hors scope)
- Formats de cartes avancés (contexte, détection d'erreur)
- Mécanismes de rappel/notification pour la régularité (rien prévu en v0)
- Personnalisation visuelle des decks (façon pochette de playlist) : idée émise lors des retours utilisateur, à explorer en v2/v3. Deux niveaux distincts :
  - Couleur de deck : simple à implémenter (sélecteur de teintes prédéfinies cohérentes avec le design system), prévu pour la modale de création de deck en cours d'implémentation.
  - Image/photo de deck : vrai sous-chantier technique à part (upload, stockage, redimensionnement, validation de format), pas à mélanger avec la modale de création simple. Reporté, pas encore scopé.
- Titre de deck stylisé (police custom par deck) : idée évoquée mais écartée pour l'instant, car ça casserait la cohérence typographique du design system (Newsreader partout). À reconsidérer seulement si une vraie demande utilisateur récurrente émerge.

## v1 en cours

- Renommage des types de cards ("Rappel classique" -> "Appréciation personnelle", "Question ouverte" -> "Avis assisté"), affichage uniquement ✅ Terminé
- Feedback pédagogique enrichi après évaluation IA (verdict + points forts/à améliorer + piste + résumé court, persisté en base dans ReviewLog) ✅ Terminé
- Choix du type de card à la génération par IA (forceType, mix auto vs type unique forcé) ✅ Terminé
- Nouveau design system "Constemps Design System" intégré (tokens, composants, nouveau logo, remplace "Bento Profile") ✅ Terminé
- Refonte ergonomique pour l'accessibilité ✅ Terminé : audit complet (parcours utilisateur, clarté des actions, accessibilité clavier/WCAG), puis corrections (notation en français, validation de réponse vide bloquée, traduction ciblée FR, distinction deck vide/session terminée, focus clavier visible sur Radio/Checkbox, piège de focus et attributs ARIA sur les modales, redirection propre sur deck introuvable, contraste WCAG corrigé sur le token inkfaint) et affordance visuelle renforcée (sélection/suppression, modale élargie et aérée) dans GenerateCardsModal

**v1 complète : app prête pour les premiers tests utilisateurs externes.**

## Dette technique connue

- Absence de tests unitaires réels sur la logique métier (seuls les tests scaffold NestJS par défaut existent actuellement). Zones prioritaires à couvrir le jour où ce chantier sera lancé : calcul du palier adaptatif (fenêtre glissante + garde-fou), mapping verdict IA -> rating FSRS, contrôle d'accès (appartenance deck/card/review à l'utilisateur connecté).
- Décision assumée : ce chantier est reporté volontairement après la première vague de retours des testeurs externes de la v1, pour éviter d'écrire des tests sur un comportement encore susceptible de changer.

## Fonctionnalités à refaire / reportées

- **TTS (prononciation audio)** : retiré du code le 3 août 2026. Initialement fonctionnel (Gemini TTS, stockage local du fichier audio, quota géré, throttle dédié), mais retiré avant l'ouverture aux testeurs externes car le quota gratuit (10 générations/jour, partagé entre tous les utilisateurs) était trop restrictif pour un usage multi-utilisateurs. À refaire proprement le jour où une meilleure solution de quota est trouvée (quota par utilisateur, provider TTS plus généreux, ou passage à un plan payant Gemini). L'implémentation précédente reste consultable dans l'historique Git.
- **Rôle admin** : pas encore implémenté. Aujourd'hui, aucun concept de rôle/admin dans l'app (tous les users sont cantonnés à leurs propres decks/cards via JWT). Pertinent à ajouter en V2 si l'app s'ouvre à plus d'utilisateurs (modération, support, consultation de la liste des users sans passer par Prisma Studio). Implémentation envisagée : un flag `isAdmin` sur le modèle `User` + un guard dédié pour protéger les futures routes admin (ex. `GET /users`).

## Modèle de données Prisma

Voir `apps/api/prisma/schema.prisma` pour le modèle de données à jour.

Le champ `type` sur `Card` suffit pour l'extensibilité V2 (ajout de valeurs à l'enum + adaptation front). Pas de table polymorphe pour un MVP à 2 types.

## Points techniques à trancher pendant le dev

### Évaluation IA des questions ouvertes (point le plus risqué du MVP)

- Sortie **forcée en JSON** (verdict + justification courte optionnelle) pour mapper direct sur un rating FSRS
- Gérer la latence dans l'UX de révision : ne pas bloquer l'utilisateur sur un spinner. Soit préaffichage de la suite de session avec verdict patché en async, soit état de chargement clair et assumé.

### Palier adaptatif

Démarrer simple : moyenne mobile sur les 7 derniers jours de reviews réussies par deck. Ne pas sur-ingénierer avant d'avoir de la donnée réelle d'usage (Wesley + Emilie).

## Conventions de travail

- Stack de référence Wesley : TypeScript, React (hooks, state, React Router), NestJS (lifecycle, Guards, Interceptors, Filters), Prisma, MySQL, Docker, JWT, Zustand/TanStack Query si besoin de state complexe côté front
- Pas de tirets longs (—) dans les textes en français (commentaires, messages UI, docs)
- Méthodologie : découpage par UC, commits atomiques, review avant merge
