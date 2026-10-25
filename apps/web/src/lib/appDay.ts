// Journée de l'app (CON-90) : de 4 h à 4 h, heure de Paris, comme le réglage
// par défaut d'Anki (« Next day starts at »). Copie à l'identique des fonctions
// de apps/api/src/common/app-day.ts dont le front a besoin (mêmes constantes,
// même algorithme) : toute modification se reporte des deux côtés. Le front s'en sert pour ce qu'il
// affiche avant toute donnée de l'API : date et saison de l'en-tête, animations
// jouées une fois par jour (dailyOnce).

export const APP_TIME_ZONE = 'Europe/Paris'
export const DAY_ROLLOVER_HOUR = 4

const wallClock = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
})

// Heure murale de Paris d'un instant.
function parisParts(date: Date) {
  const parts: Record<string, number> = {}
  for (const { type, value } of wallClock.formatToParts(date)) {
    if (type !== 'literal') parts[type] = Number(value)
  }
  return parts as Record<'year' | 'month' | 'day' | 'hour', number>
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function addAppDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + days))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

// Clé « AAAA-MM-JJ » de la journée de l'app qui contient cet instant : la date
// de Paris, ou la veille avant 4 h. Lue sur l'heure murale, pas en retirant
// quatre heures à l'instant (faux les jours de changement d'heure).
export function appDayKey(date: Date): string {
  const p = parisParts(date)
  const key = `${p.year}-${pad(p.month)}-${pad(p.day)}`
  return p.hour < DAY_ROLLOVER_HOUR ? addAppDays(key, -1) : key
}
