// Sous-ensemble des teintes déjà définies dans tailwind.config.js, réutilisées comme
// couleurs de personnalisation de deck. "clay" est volontairement exclu : réservé à
// l'état "palier atteint" (MilestoneBanner / ProgressBar tone="positive").
export const DECK_COLORS = ['indigo', 'success', 'warning', 'danger'] as const;

export type DeckColor = (typeof DECK_COLORS)[number];
