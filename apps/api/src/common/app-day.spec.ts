import {
  addAppDays,
  appDayKey,
  appDayStart,
  appDaysBetween,
  appDaysUntil,
  appTimeZoneAvailable,
  nextAppDayStart,
  startOfAppDay,
} from './app-day';

// Journée de l'app (CON-90) : de 4 h à 4 h, heure de Paris. Les instants sont
// écrits en UTC : Paris = UTC+2 en été, UTC+1 en hiver.
const at = (iso: string) => new Date(iso);

describe('appDayKey', () => {
  it('rattache 23 h à la journée en cours', () => {
    // 22/10/2026 23:00 heure d'été
    expect(appDayKey(at('2026-10-22T21:00:00Z'))).toBe('2026-10-22');
  });

  it('rattache 2 h du matin à la veille', () => {
    // 23/10/2026 02:00 heure d'été
    expect(appDayKey(at('2026-10-23T00:00:00Z'))).toBe('2026-10-22');
  });

  it('bascule à 4 h pile', () => {
    // 23/10/2026 03:59:59.999 puis 04:00:00.000 heure d'été
    expect(appDayKey(at('2026-10-23T01:59:59.999Z'))).toBe('2026-10-22');
    expect(appDayKey(at('2026-10-23T02:00:00.000Z'))).toBe('2026-10-23');
  });

  it('range les deux 2 h 30 du recul de l’heure dans la même journée', () => {
    // 25/10/2026 : 02:30 heure d'été puis 02:30 heure d'hiver
    expect(appDayKey(at('2026-10-25T00:30:00Z'))).toBe('2026-10-24');
    expect(appDayKey(at('2026-10-25T01:30:00Z'))).toBe('2026-10-24');
    // 03:59 heure d'hiver : encore le 24 ; 04:00 : le 25
    expect(appDayKey(at('2026-10-25T02:59:00Z'))).toBe('2026-10-24');
    expect(appDayKey(at('2026-10-25T03:00:00Z'))).toBe('2026-10-25');
  });

  it('bascule à 4 h le jour de l’avance de l’heure', () => {
    // 28/03/2027 : 03:59 heure d'été (01:59Z) puis 04:00 (02:00Z)
    expect(appDayKey(at('2027-03-28T01:59:00Z'))).toBe('2027-03-27');
    expect(appDayKey(at('2027-03-28T02:00:00Z'))).toBe('2027-03-28');
  });
});

describe('appDayStart', () => {
  it('commence à 4 h, heure d’été ou d’hiver', () => {
    expect(appDayStart('2026-10-24').toISOString()).toBe(
      '2026-10-24T02:00:00.000Z',
    );
    expect(appDayStart('2026-10-25').toISOString()).toBe(
      '2026-10-25T03:00:00.000Z',
    );
    expect(appDayStart('2026-01-15').toISOString()).toBe(
      '2026-01-15T03:00:00.000Z',
    );
  });

  it('donne 25 h à la journée du recul de l’heure', () => {
    const length =
      appDayStart('2026-10-25').getTime() - appDayStart('2026-10-24').getTime();
    expect(length).toBe(25 * 3600 * 1000);
  });

  it('donne 23 h à la journée de l’avance de l’heure', () => {
    const length =
      appDayStart('2027-03-28').getTime() - appDayStart('2027-03-27').getTime();
    expect(length).toBe(23 * 3600 * 1000);
    expect(appDayStart('2027-03-28').toISOString()).toBe(
      '2027-03-28T02:00:00.000Z',
    );
  });
});

describe('startOfAppDay et nextAppDayStart', () => {
  it('encadrent l’instant donné', () => {
    const now = at('2026-10-23T00:00:00Z'); // 23/10 02:00, journée du 22
    expect(startOfAppDay(now).toISOString()).toBe('2026-10-22T02:00:00.000Z');
    expect(nextAppDayStart(now).toISOString()).toBe('2026-10-23T02:00:00.000Z');
  });

  it('rend disponible dès 4 h une carte notée « Encore » la veille au soir', () => {
    // Notée le 22/10 à 23:00 : FSRS la fixe au 23/10 à 23:00.
    const due = at('2026-10-23T21:00:00Z');
    const morning = at('2026-10-23T02:00:00Z'); // 23/10 04:00
    expect(due < nextAppDayStart(morning)).toBe(true);
    const night = at('2026-10-23T01:59:59.999Z'); // 23/10 03:59, encore le 22
    expect(due < nextAppDayStart(night)).toBe(false);
  });
});

describe('addAppDays et appDaysBetween', () => {
  it('comptent en journées, changement d’heure compris', () => {
    expect(addAppDays('2026-10-24', 1)).toBe('2026-10-25');
    expect(addAppDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addAppDays('2027-03-01', -1)).toBe('2027-02-28');
    expect(appDaysBetween('2026-10-24', '2026-10-27')).toBe(3);
    expect(appDaysBetween('2027-03-27', '2027-03-29')).toBe(2);
    expect(appDaysBetween('2026-10-27', '2026-10-24')).toBe(-3);
  });
});

describe('appDaysUntil', () => {
  it('compte les journées jusqu’à la prochaine échéance', () => {
    const now = at('2026-10-23T08:00:00Z'); // 23/10 10:00
    // « Correct » sur une carte neuve à 21:30 le 22 : due le 25 à 21:30.
    expect(appDaysUntil(now, at('2026-10-25T19:30:00Z'))).toBe(2);
    // Due le 24 à 03:00 : encore la journée du 23 (déjà disponible).
    expect(appDaysUntil(now, at('2026-10-24T01:00:00Z'))).toBe(0);
    // Due le 24 à 04:00 : demain.
    expect(appDaysUntil(now, at('2026-10-24T02:00:00Z'))).toBe(1);
    expect(appDaysUntil(now, null)).toBeNull();
  });
});

describe('appTimeZoneAvailable', () => {
  it('trouve le fuseau de Paris', () => {
    expect(appTimeZoneAvailable()).toBe(true);
  });
});
