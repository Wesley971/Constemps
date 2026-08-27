import { startOfDay } from './date';

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

interface ComputeAdaptiveDailyGoalInput {
  firstReviewedAt: Date | null;
  successfulLogsInWindow: Date[];
  defaultGoal: number;
}

// Formule du palier adaptatif (moyenne mobile sur les 7 derniers jours de
// reviews réussies), partagée entre ReviewsService (calcul temps réel par
// deck, voir computeDailyGoal) et DecksService (calcul batché pour GET
// /decks, voir CON-36). Toute évolution de la formule se fait ici : les deux
// appelants doivent rester en phase.
export function computeAdaptiveDailyGoal({
  firstReviewedAt,
  successfulLogsInWindow,
  defaultGoal,
}: ComputeAdaptiveDailyGoalInput): number {
  if (!firstReviewedAt) {
    return defaultGoal;
  }

  const daysSinceFirstReview = Math.floor(
    (Date.now() - firstReviewedAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSinceFirstReview < DAILY_GOAL_WINDOW_DAYS) {
    return defaultGoal;
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
  const average = total / DAILY_GOAL_WINDOW_DAYS;
  return Math.max(MIN_DAILY_GOAL, Math.round(average));
}
