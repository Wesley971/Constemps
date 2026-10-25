import {
  computeAdaptiveDailyGoal,
  extendedGoalFor,
  newCardsLeftToday,
  todayGoals,
} from './daily-goal';

// Palier du jour ramené aux cartes disponibles (CON-87), pour un deck neuf :
// palier brut 10, palier étendu brut 20.
const RAW = { dailyGoal: 10, extendedGoal: extendedGoalFor(10) };

// Sans précision, toutes les cartes disponibles sont des révisions (déjà vues) :
// les cas de CON-87 et CON-88 gardent exactement leur résultat (CON-89).
const today = (
  reviewedToday: number,
  dueCardsCount: number,
  dueReviewCount = dueCardsCount,
  newLearnedToday = 0,
) =>
  todayGoals({
    ...RAW,
    reviewedToday,
    dueCardsCount,
    dueReviewCount,
    newLearnedToday,
  });

describe('todayGoals', () => {
  it('clôt la journée à 3 sur 3 quand le deck n’a que 3 cartes', () => {
    expect(today(3, 0)).toEqual({
      dailyGoal: 3,
      extendedGoal: 3,
      reached: true,
      canContinue: false,
    });
  });

  it('rouvre la journée quand des cartes sont ajoutées ensuite', () => {
    expect(today(3, 2)).toEqual({
      dailyGoal: 5,
      extendedGoal: 5,
      reached: false,
      canContinue: true,
    });
  });

  it('garde le palier brut et propose de continuer quand il reste des révisions', () => {
    expect(today(10, 2)).toEqual({
      dailyGoal: 10,
      extendedGoal: 12,
      reached: true,
      canContinue: true,
    });
  });

  it('clôt une extension qui a épuisé les cartes dues', () => {
    expect(today(12, 0)).toEqual({
      dailyGoal: 10,
      extendedGoal: 12,
      reached: true,
      canContinue: false,
    });
  });

  it('laisse « à jour » un deck sans carte due ni révision du jour', () => {
    expect(today(0, 0)).toEqual({
      dailyGoal: 0,
      extendedGoal: 0,
      reached: false,
      canContinue: false,
    });
  });

  it('ne propose plus de continuer une fois le palier étendu brut atteint (état capped)', () => {
    expect(today(20, 5)).toEqual({
      dailyGoal: 10,
      extendedGoal: 20,
      reached: true,
      canContinue: false,
    });
  });

  it('propose de réviser un deck de cartes neuves, toutes disponibles', () => {
    expect(today(0, 4, 0)).toEqual({
      dailyGoal: 4,
      extendedGoal: 4,
      reached: false,
      canContinue: true,
    });
  });

  it('ne propose pas d’extension quand il ne reste que des cartes neuves (CON-89)', () => {
    expect(today(10, 3, 0)).toEqual({
      dailyGoal: 10,
      extendedGoal: 10,
      reached: true,
      canContinue: false,
    });
  });

  it('ne compte que les révisions dans l’extension quand neuves et révisions se mêlent', () => {
    expect(today(10, 5, 2)).toEqual({
      dailyGoal: 10,
      extendedGoal: 12,
      reached: true,
      canContinue: true,
    });
  });

  it('laisse les cartes neuves du quota compléter le palier', () => {
    expect(today(4, 10, 6)).toEqual({
      dailyGoal: 10,
      extendedGoal: 10,
      reached: false,
      canContinue: true,
    });
  });

  it('ne sert pas plus de 5 cartes neuves par jour (CON-89)', () => {
    expect(today(0, 30, 0)).toEqual({
      dailyGoal: 5,
      extendedGoal: 5,
      reached: false,
      canContinue: true,
    });
  });

  it('clôt la journée une fois le quota de neuves appris, même s’il en reste', () => {
    expect(today(5, 25, 0, 5)).toEqual({
      dailyGoal: 5,
      extendedGoal: 5,
      reached: true,
      canContinue: false,
    });
  });

  it('compte les neuves déjà apprises dans le quota du jour', () => {
    expect(today(3, 20, 0, 3)).toEqual({
      dailyGoal: 5,
      extendedGoal: 5,
      reached: false,
      canContinue: true,
    });
  });
});

describe('newCardsLeftToday', () => {
  it('rend le reste du quota, dans la limite des neuves disponibles', () => {
    expect(newCardsLeftToday(0, 200)).toBe(5);
    expect(newCardsLeftToday(2, 200)).toBe(3);
    expect(newCardsLeftToday(0, 2)).toBe(2);
    expect(newCardsLeftToday(7, 200)).toBe(0);
  });
});

describe('computeAdaptiveDailyGoal', () => {
  // Deck révisé depuis plus de 7 jours, sans réussite récente : seul le plancher
  // des révisions dues joue.
  const old = {
    firstReviewedAt: new Date(Date.now() - 30 * 86400e3),
    newLearnedToday: 0,
    dueNewCount: 0,
  };
  const fresh = { firstReviewedAt: null, successfulLogsInWindow: [] };

  it('ne compte que les révisions dues dans le plancher (CON-89)', () => {
    expect(
      computeAdaptiveDailyGoal({
        ...old,
        successfulLogsInWindow: [],
        dueReviewCount: 0,
      }),
    ).toBe(1);
    expect(
      computeAdaptiveDailyGoal({
        ...old,
        successfulLogsInWindow: [],
        dueReviewCount: 12,
      }),
    ).toBe(12);
  });

  it('plafonne le plancher des révisions dues à 30', () => {
    expect(
      computeAdaptiveDailyGoal({
        ...old,
        successfulLogsInWindow: [],
        dueReviewCount: 50,
      }),
    ).toBe(30);
  });

  it('ajoute le quota de neuves au rythme des révisions (CON-89)', () => {
    expect(
      computeAdaptiveDailyGoal({
        ...old,
        successfulLogsInWindow: [],
        dueReviewCount: 12,
        dueNewCount: 200,
      }),
    ).toBe(17);
    expect(
      computeAdaptiveDailyGoal({
        ...old,
        successfulLogsInWindow: [],
        dueReviewCount: 0,
        dueNewCount: 3,
      }),
    ).toBe(3);
  });

  it('garde le même quota au fil de la journée', () => {
    expect(
      computeAdaptiveDailyGoal({
        ...old,
        successfulLogsInWindow: [],
        dueReviewCount: 12,
        newLearnedToday: 4,
        dueNewCount: 196,
      }),
    ).toBe(17);
  });

  it('part de 10 révisions plus le quota pour un deck neuf', () => {
    expect(
      computeAdaptiveDailyGoal({
        ...fresh,
        dueReviewCount: 0,
        newLearnedToday: 0,
        dueNewCount: 200,
      }),
    ).toBe(15);
    expect(
      computeAdaptiveDailyGoal({
        ...fresh,
        dueReviewCount: 0,
        newLearnedToday: 0,
        dueNewCount: 0,
      }),
    ).toBe(10);
  });
});

describe('extendedGoalFor', () => {
  it('double le palier, avec un bonus plafonné à 20 cartes', () => {
    expect(extendedGoalFor(10)).toBe(20);
    expect(extendedGoalFor(30)).toBe(50);
  });
});
