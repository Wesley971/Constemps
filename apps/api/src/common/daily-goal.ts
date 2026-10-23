import { startOfDay } from './date';

// Valeur de départ avant historique suffisant (deck tout neuf, ou moins de
// DAILY_GOAL_WINDOW_DAYS jours depuis la première review). Remplace l'ancien
// champ Deck.dailyGoal, supprimé en CON-39 : ce champ n'était jamais
// personnalisé (aucun DTO ne l'exposait) et restait figé à sa valeur par
// défaut depuis la création du deck, donc une constante partagée joue
// exactement le même rôle sans la dette d'un champ DB mort.
export const DEFAULT_DAILY_GOAL = 10;

export const DAILY_GOAL_WINDOW_DAYS = 7;
export const DAILY_GOAL_WINDOW_MS =
  DAILY_GOAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;
export const MIN_DAILY_GOAL = 1;
// Quand la moyenne mobile s'effondre au plancher (deck peu régulier), on ne
// bloque pas complètement les cards jamais révisées : le palier remonte à une
// fraction du dailyGoal par défaut du deck plutôt que de rester bloqué à 1.
// Utilisé par ReviewsService.getDailyCapState ET par DecksService.findAll
// (le badge "palier atteint" doit refléter le même seuil que la session).
export const MIN_DAILY_GOAL_FRACTION_DIVISOR = 3;

// CON-39 : sur une fenêtre de 7 jours utilisée irrégulièrement, diviser par 7
// systématiquement fait chuter artificiellement la moyenne même quand le
// rythme réel (les jours où l'utilisateur révise vraiment) est correct. On ne
// bascule sur "jours réellement actifs" qu'à partir de 2 jours actifs
// distincts, pour ne pas extrapoler un palier permanent depuis une session
// isolée (esprit anti-cram, CLAUDE.md) : avec 1 seul jour actif, le diviseur
// fixe (7) reste la valeur la plus prudente.
export const MIN_ACTIVE_DAYS_FOR_PACE = 2;

// CON-39 : le volume de cartes dues fait remonter le palier (jamais le
// baisser), plafonné pour rester dans l'esprit anti-frustration même sur un
// backlog massif. Même multiplicateur que MIN_DAILY_GOAL_FRACTION_DIVISOR,
// utilisé en sens inverse (plancher ÷3 côté MIN_DAILY_GOAL, plafond ×3 ici).
export const DUE_CARDS_GOAL_CAP =
  DEFAULT_DAILY_GOAL * MIN_DAILY_GOAL_FRACTION_DIVISOR;

interface ComputeAdaptiveDailyGoalInput {
  firstReviewedAt: Date | null;
  successfulLogsInWindow: Date[];
  dueCardsCount: number;
}

// Formule du palier adaptatif, partagée entre ReviewsService (calcul temps
// réel par deck, voir computeDailyGoal) et DecksService (calcul batché pour
// GET /decks, voir CON-36). Toute évolution de la formule se fait ici : les
// deux appelants doivent rester en phase.
export function computeAdaptiveDailyGoal({
  firstReviewedAt,
  successfulLogsInWindow,
  dueCardsCount,
}: ComputeAdaptiveDailyGoalInput): number {
  if (!firstReviewedAt) {
    return DEFAULT_DAILY_GOAL;
  }

  const daysSinceFirstReview = Math.floor(
    (Date.now() - firstReviewedAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSinceFirstReview < DAILY_GOAL_WINDOW_DAYS) {
    return DEFAULT_DAILY_GOAL;
  }

  const countsByDay = new Map<string, number>();
  for (const reviewedAt of successfulLogsInWindow) {
    const key = startOfDay(reviewedAt).toISOString();
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  const total = [...countsByDay.values()].reduce(
    (sum, count) => sum + count,
    0,
  );
  const activeDays = countsByDay.size;
  const paceDivisor =
    activeDays >= MIN_ACTIVE_DAYS_FOR_PACE
      ? activeDays
      : DAILY_GOAL_WINDOW_DAYS;
  const paceAverage = total / paceDivisor;

  const dueCardsFloor = Math.min(dueCardsCount, DUE_CARDS_GOAL_CAP);

  return Math.max(
    MIN_DAILY_GOAL,
    Math.round(Math.max(paceAverage, dueCardsFloor)),
  );
}

export interface SessionSnapshot {
  sessionDailyGoal: number | null;
  sessionExtendedGoal: number | null;
  sessionSnapshotAt: Date | null;
}

// Palier figé d'une session de révision active (CON-49), ou null s'il faut le
// recalculer : aucun snapshot, snapshot d'un autre jour calendaire, ou session
// déjà conclue (palier ou palier étendu atteint). Règle unique partagée par
// ReviewsService.getDailyCapState (qui réécrit le snapshot quand elle renvoie
// null) et DecksService.findAll (lecture seule, CON-68) : l'accueil et l'écran
// de révision affichent ainsi toujours le même palier.
export function activeSessionGoals(
  snapshot: SessionSnapshot | null,
  reviewedToday: number,
  todayStart: Date,
): { dailyGoal: number; extendedGoal: number } | null {
  if (
    snapshot?.sessionDailyGoal == null ||
    snapshot.sessionExtendedGoal == null ||
    snapshot.sessionSnapshotAt == null ||
    snapshot.sessionSnapshotAt < todayStart ||
    reviewedToday >= snapshot.sessionExtendedGoal ||
    reviewedToday >= snapshot.sessionDailyGoal
  ) {
    return null;
  }
  return {
    dailyGoal: snapshot.sessionDailyGoal,
    extendedGoal: snapshot.sessionExtendedGoal,
  };
}
