// Sélection Phosphor (poids bold) volontairement restreinte, pertinente pour des
// sujets d'apprentissage courants. Miroir de la liste front (design-system/constants.ts).
export const DECK_ICONS = [
  'ph:book-bold',
  'ph:code-bold',
  'ph:globe-bold',
  'ph:music-notes-bold',
  'ph:lightbulb-bold',
  'ph:flask-bold',
  'ph:calculator-bold',
  'ph:palette-bold',
] as const;

export type DeckIcon = (typeof DECK_ICONS)[number];
