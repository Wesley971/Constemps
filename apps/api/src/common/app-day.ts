// Journée de l'app (CON-90) : de 4 h à 4 h, heure de Paris, comme le réglage
// par défaut d'Anki (« Next day starts at »). Seule définition de « la journée »
// de l'API : révisions du jour, palier figé, cartes disponibles, série, jalons
// et historique. Tout passe par Intl avec un fuseau explicite, jamais par
// l'heure du processus (UTC dans l'image Docker, Paris en local).
// Copie à l'identique côté front : apps/web/src/lib/appDay.ts. Toute
// modification (fuseau, heure de bascule, algorithme) se reporte des deux côtés.
//
// 4 h n'est jamais une heure ambiguë ni sautée : les changements d'heure de
// Paris se font entre 2 h et 3 h. Une journée de l'app dure donc 23 h ou 25 h
// les jours de changement d'heure, et 24 h sinon.

export const APP_TIME_ZONE = 'Europe/Paris';
export const DAY_ROLLOVER_HOUR = 4;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const wallClock = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

// Heure murale de Paris d'un instant.
function parisParts(date: Date) {
  const parts: Record<string, number> = {};
  for (const { type, value } of wallClock.formatToParts(date)) {
    if (type !== 'literal') parts[type] = Number(value);
  }
  return parts as Record<
    'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
    number
  >;
}

// Décalage de Paris sur UTC à cet instant, en millisecondes (1 h ou 2 h).
function parisOffsetMs(date: Date): number {
  const p = parisParts(date);
  const asUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function parseKey(key: string): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y, m, d];
}

// Clé « AAAA-MM-JJ » de la journée de l'app qui contient cet instant : la date
// de Paris, ou la veille avant 4 h. Lue sur l'heure murale, pas en retirant
// quatre heures à l'instant (faux les jours de changement d'heure).
export function appDayKey(date: Date): string {
  const p = parisParts(date);
  const key = `${p.year}-${pad(p.month)}-${pad(p.day)}`;
  return p.hour < DAY_ROLLOVER_HOUR ? addAppDays(key, -1) : key;
}

// Instant où commence une journée de l'app : 4 h, heure de Paris, ce jour-là.
export function appDayStart(key: string): Date {
  const [y, m, d] = parseKey(key);
  const wall = Date.UTC(y, m - 1, d, DAY_ROLLOVER_HOUR);
  // Deux passes : le décalage lu à la première estimation peut différer de
  // celui de l'instant cherché un jour de changement d'heure.
  let instant = wall - parisOffsetMs(new Date(wall));
  instant = wall - parisOffsetMs(new Date(instant));
  return new Date(instant);
}

export function addAppDays(key: string, days: number): string {
  const [y, m, d] = parseKey(key);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

// Nombre de journées de l'app de « from » à « to » (négatif si « to » est avant).
export function appDaysBetween(from: string, to: string): number {
  const [y1, m1, d1] = parseKey(from);
  const [y2, m2, d2] = parseKey(to);
  return Math.round(
    (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY_MS,
  );
}

export function startOfAppDay(date: Date): Date {
  return appDayStart(appDayKey(date));
}

// Début de la journée suivante : une carte dont l'échéance tombe avant cet
// instant est disponible aujourd'hui (CON-90).
export function nextAppDayStart(date: Date): Date {
  return appDayStart(addAppDays(appDayKey(date), 1));
}

// Prochaine échéance en journées (CON-90) : 1 pour demain, 3 pour dans trois
// jours. null sans échéance (deck sans carte).
export function appDaysUntil(now: Date, due: Date | null): number | null {
  return due ? appDaysBetween(appDayKey(now), appDayKey(due)) : null;
}

// Contrôle au démarrage : sans données de fuseau (image sans ICU complet),
// Intl retomberait sur UTC en silence.
export function appTimeZoneAvailable(): boolean {
  try {
    return wallClock.resolvedOptions().timeZone === APP_TIME_ZONE;
  } catch {
    return false;
  }
}
