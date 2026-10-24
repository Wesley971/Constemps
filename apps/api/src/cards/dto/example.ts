// Phrase d'exemple d'une carte (CON-77) : mêmes règles et même message que le
// front (apps/web/src/lib/card.ts), toute modification se reporte des deux côtés.
export const EXAMPLE_MAX_LENGTH = 200;
// Longueur comptée en caractères (drapeau u), comme le VARCHAR(200) de MySQL ;
// une seule règle, qui refuse aussi une valeur qui n'est pas une chaîne.
export const EXAMPLE_PATTERN = new RegExp(
  `^[\\s\\S]{1,${EXAMPLE_MAX_LENGTH}}$`,
  'u',
);
export const EXAMPLE_MESSAGE = `La phrase d'exemple ne doit pas dépasser ${EXAMPLE_MAX_LENGTH} caractères.`;

// Normalisation avant validation : forme NFC, espaces retirés aux bords et
// réduits à un seul à l'intérieur. Un champ vide devient null (pas d'exemple).
export function normalizeExample(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.normalize('NFC').trim().replace(/\s+/g, ' ');
  return normalized === '' ? null : normalized;
}
