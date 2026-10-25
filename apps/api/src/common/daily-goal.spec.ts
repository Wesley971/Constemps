import { extendedGoalFor, todayGoals } from './daily-goal';

// Palier du jour ramené aux cartes disponibles (CON-87), pour un deck neuf :
// palier brut 10, palier étendu brut 20.
const RAW = { dailyGoal: 10, extendedGoal: extendedGoalFor(10) };

describe('todayGoals', () => {
  it('clôt la journée à 3 sur 3 quand le deck n’a que 3 cartes', () => {
    expect(todayGoals({ ...RAW, reviewedToday: 3, dueCardsCount: 0 })).toEqual({
      dailyGoal: 3,
      extendedGoal: 3,
      reached: true,
      canContinue: false,
    });
  });

  it('rouvre la journée quand des cartes sont ajoutées ensuite', () => {
    expect(todayGoals({ ...RAW, reviewedToday: 3, dueCardsCount: 2 })).toEqual({
      dailyGoal: 5,
      extendedGoal: 5,
      reached: false,
      canContinue: true,
    });
  });

  it('garde le palier brut et propose de continuer quand il reste des cartes', () => {
    expect(todayGoals({ ...RAW, reviewedToday: 10, dueCardsCount: 2 })).toEqual(
      {
        dailyGoal: 10,
        extendedGoal: 12,
        reached: true,
        canContinue: true,
      },
    );
  });

  it('clôt une extension qui a épuisé les cartes dues', () => {
    expect(todayGoals({ ...RAW, reviewedToday: 12, dueCardsCount: 0 })).toEqual(
      {
        dailyGoal: 10,
        extendedGoal: 12,
        reached: true,
        canContinue: false,
      },
    );
  });

  it('laisse « à jour » un deck sans carte due ni révision du jour', () => {
    expect(todayGoals({ ...RAW, reviewedToday: 0, dueCardsCount: 0 })).toEqual({
      dailyGoal: 0,
      extendedGoal: 0,
      reached: false,
      canContinue: false,
    });
  });

  it('ne propose plus de continuer une fois le palier étendu brut atteint (état capped)', () => {
    expect(todayGoals({ ...RAW, reviewedToday: 20, dueCardsCount: 5 })).toEqual(
      {
        dailyGoal: 10,
        extendedGoal: 20,
        reached: true,
        canContinue: false,
      },
    );
  });

  it('propose de réviser un deck de cartes nouvelles, toutes dues', () => {
    expect(todayGoals({ ...RAW, reviewedToday: 0, dueCardsCount: 4 })).toEqual({
      dailyGoal: 4,
      extendedGoal: 4,
      reached: false,
      canContinue: true,
    });
  });
});

describe('extendedGoalFor', () => {
  it('double le palier, avec un bonus plafonné à 20 cartes', () => {
    expect(extendedGoalFor(10)).toBe(20);
    expect(extendedGoalFor(30)).toBe(50);
  });
});
