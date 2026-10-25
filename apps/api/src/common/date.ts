// Fenêtres glissantes en durée (rétention, tendance, messages). Pour tout ce
// qui se compte en journées, utiliser la journée de l'app (./app-day.ts, CON-90).
export function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}
