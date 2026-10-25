import { appDayKey } from './app-day';

// Valeur de départ avant historique suffisant (deck tout neuf, ou moins de
// DAILY_GOAL_WINDOW_DAYS jours depuis la première review). Depuis CON-89,
// c'est le rythme des révisions de départ : le quota de neuves s'y ajoute,
// et le palier affiché reste ramené aux cartes servables. Remplace l'ancien
// champ Deck.dailyGoal, supprimé en CON-39 : ce champ n'était jamais
// personnalisé (aucun DTO ne l'exposait) et restait figé à sa valeur par
// défaut depuis la création du deck, donc une constante partagée joue
// exactement le même rôle sans la dette d'un champ DB mort.
export const DEFAULT_DAILY_GOAL = 10;

export const DAILY_GOAL_WINDOW_DAYS = 7;
export const DAILY_GOAL_WINDOW_MS =
  DAILY_GOAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;
// Plancher absolu du palier adaptatif. Le seul autre plancher est celui des
// révisions dues (DUE_CARDS_GOAL_CAP, plus bas) : tant que des révisions
// attendent, le palier ne descend pas sous leur nombre (jusqu'à 30).
export const MIN_DAILY_GOAL = 1;
// Multiplicateur du plafond des révisions dues (DUE_CARDS_GOAL_CAP). Avant
// CON-39, il servait aussi à un plancher de « 10 / 3 » quand la moyenne tombait
// à 1 avec des cartes neuves ; ce plancher n'existe plus (CON-89 : constat).
export const MIN_DAILY_GOAL_FRACTION_DIVISOR = 3;

// CON-39 : sur une fenêtre de 7 jours utilisée irrégulièrement, diviser par 7
// systématiquement fait chuter artificiellement la moyenne même quand le
// rythme réel (les jours où l'utilisateur révise vraiment) est correct. On ne
// bascule sur "jours réellement actifs" qu'à partir de 2 jours actifs
// distincts, pour ne pas extrapoler un palier permanent depuis une session
// isolée (esprit anti-cram, CLAUDE.md) : avec 1 seul jour actif, le diviseur
// fixe (7) reste la valeur la plus prudente.
export const MIN_ACTIVE_DAYS_FOR_PACE = 2;

// CON-39 : le volume de révisions dues fait remonter le palier (jamais le
// baisser), plafonné pour rester dans l'esprit anti-frustration même sur un
// backlog massif. Seulement les révisions (CON-89) : des cartes neuves créées
// ou générées en nombre ne doivent pas imposer autant de nouveautés par jour,
// chacune crée du travail pour les jours suivants. Elles ont leur propre
// quota, NEW_CARDS_PER_DAY.
export const DUE_CARDS_GOAL_CAP =
  DEFAULT_DAILY_GOAL * MIN_DAILY_GOAL_FRACTION_DIVISOR;

// Quota de cartes neuves par jour et par deck (CON-89, décision de Wesley),
// séparé du rythme des révisions : sans lui, le palier ne compte que des
// réussites qui ne peuvent pas le dépasser, et il ne fait que baisser (cliquet
// montré par simulation). Nombre fixe, sans réduction automatique.
export const NEW_CARDS_PER_DAY = 5;

// Cartes neuves encore servables aujourd'hui : le quota moins les neuves déjà
// apprises dans la journée, dans la limite des neuves disponibles.
export function newCardsLeftToday(
  newLearnedToday: number,
  dueNewCount: number,
): number {
  return Math.min(
    dueNewCount,
    Math.max(0, NEW_CARDS_PER_DAY - newLearnedToday),
  );
}

interface ComputeAdaptiveDailyGoalInput {
  firstReviewedAt: Date | null;
  // Réussites seulement (Correct et Facile) : un palier prudent, qui ne
  // grossit pas avec les échecs. reviewedToday, lui, compte toutes les notes,
  // « Encore » comprises : c'est un vrai effort de la journée, et la carte ne
  // revient pas le même jour (enable_short_term: false), donc rien n'est
  // compté deux fois (décision de Wesley, CON-89).
  // Révisions seulement : la première révision d'une carte (carte neuve)
  // n'y entre pas, sinon le quota de neuves gonflerait le rythme jour après
  // jour (CON-89).
  successfulLogsInWindow: Date[];
  // Révisions dues seulement, sans les cartes neuves (CON-89).
  dueReviewCount: number;
  // Cartes neuves apprises aujourd'hui (première révision dans la journée) et
  // cartes neuves disponibles : le quota du jour en découle (CON-89).
  newLearnedToday: number;
  dueNewCount: number;
}

// Formule du palier adaptatif, partagée entre ReviewsService (calcul temps
// réel par deck, voir computeDailyGoal) et DecksService (calcul batché pour
// GET /decks, voir CON-36). Toute évolution de la formule se fait ici : les
// deux appelants doivent rester en phase.
// Palier = rythme des révisions + quota de neuves du jour (CON-89). Le quota
// compte les neuves déjà apprises aujourd'hui, pour que le palier ne change pas
// au fil de la journée.
export function computeAdaptiveDailyGoal(
  input: ComputeAdaptiveDailyGoalInput,
): number {
  const newCardsQuota = Math.min(
    NEW_CARDS_PER_DAY,
    input.newLearnedToday + input.dueNewCount,
  );
  return Math.max(MIN_DAILY_GOAL, reviewPace(input) + newCardsQuota);
}

// Rythme des révisions : moyenne des réussites, relevée par les révisions dues.
function reviewPace({
  firstReviewedAt,
  successfulLogsInWindow,
  dueReviewCount,
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
    // Jours de révision comptés en journées de l'app (CON-90).
    const key = appDayKey(reviewedAt);
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

  const dueReviewsFloor = Math.min(dueReviewCount, DUE_CARDS_GOAL_CAP);

  return Math.round(Math.max(paceAverage, dueReviewsFloor));
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

// Palier étendu (opt-in) : double du palier initial, mais le bonus est
// plafonné à 20 cards supplémentaires pour éviter un cram illimité sur les
// decks dont le palier adaptatif est déjà élevé. Pour un dailyGoal <= 20 (cas
// courant), ça revient exactement à un doublement.
export const EXTENSION_BONUS_CAP = 20;

export function extendedGoalFor(dailyGoal: number): number {
  return dailyGoal + Math.min(dailyGoal, EXTENSION_BONUS_CAP);
}

interface TodayGoalsInput {
  // Paliers bruts : figés de la session (activeSessionGoals) ou adaptatifs.
  dailyGoal: number;
  extendedGoal: number;
  reviewedToday: number;
  // Toutes les cartes disponibles aujourd'hui, neuves comprises.
  dueCardsCount: number;
  // Parmi elles, les révisions (cartes déjà vues), seules servies pendant
  // l'extension (CON-89).
  dueReviewCount: number;
  // Cartes neuves déjà apprises aujourd'hui, pour le quota (CON-89).
  newLearnedToday: number;
}

export interface TodayGoals {
  dailyGoal: number;
  extendedGoal: number;
  reached: boolean;
  canContinue: boolean;
}

// Palier du jour affiché (CON-87), seul calcul partagé par l'écran de révision
// (ReviewsService.getSession) et les plaquettes de l'accueil (DecksService) :
// les paliers bruts ramenés aux cartes réellement disponibles aujourd'hui
// (faites + servables), pour qu'un deck de 3 cartes se close à 3 sur 3 partout.
// Servables : les révisions dues et les neuves encore dans le quota du jour
// (CON-89) ; les neuves au-delà attendent demain.
// Calculé à la lecture, jamais écrit dans le snapshot de session : des cartes
// ajoutées ou redevenues dues plus tard relèvent l'objectif jusqu'au palier brut.
// Atteint seulement avec au moins une carte faite aujourd'hui : un deck sans
// rien à revoir ni rien de fait reste « à jour », pas « journée close ».
// Le blocage strict (palier étendu, état capped et 403) reste sur le brut.
// canContinue (CON-88, CON-89) : la révision a vraiment quelque chose à servir
// aujourd'hui. Sous le palier étendu brut, il reste une carte servable avant
// le palier, et une révision une fois le palier atteint : l'extension ne sert
// jamais de cartes neuves (elle sert à rattraper, pas à apprendre plus).
// Le palier étendu affiché suit la même règle : au-delà du palier du jour, il
// ne compte que les révisions disponibles.
export function todayGoals({
  dailyGoal,
  extendedGoal,
  reviewedToday,
  dueCardsCount,
  dueReviewCount,
  newLearnedToday,
}: TodayGoalsInput): TodayGoals {
  const servableToday =
    dueReviewCount +
    newCardsLeftToday(newLearnedToday, dueCardsCount - dueReviewCount);
  const goal = Math.min(dailyGoal, reviewedToday + servableToday);
  const reached = reviewedToday > 0 && reviewedToday >= goal;
  const servable = reached ? dueReviewCount : servableToday;
  return {
    dailyGoal: goal,
    extendedGoal: Math.min(
      extendedGoal,
      Math.max(goal, reviewedToday + dueReviewCount),
    ),
    reached,
    canContinue: servable > 0 && reviewedToday < extendedGoal,
  };
}
