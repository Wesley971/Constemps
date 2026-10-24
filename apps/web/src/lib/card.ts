// Phrase d'exemple d'une carte (CON-77) : mêmes règles et même message que l'API
// (apps/api/src/cards/dto/example.ts), toute modification se reporte des deux
// côtés. Longueur comptée en caractères (drapeau u), comme le VARCHAR(200).
const EXAMPLE_MAX_LENGTH = 200
const EXAMPLE_PATTERN = new RegExp(`^[\\s\\S]{1,${EXAMPLE_MAX_LENGTH}}$`, 'u')
export const EXAMPLE_MESSAGE = `La phrase d'exemple ne doit pas dépasser ${EXAMPLE_MAX_LENGTH} caractères.`

// Même normalisation que l'API : forme NFC, espaces retirés aux bords et
// réduits à un seul. Chaîne vide : null, pas d'exemple.
export function normalizeExample(value: string): string | null {
  const normalized = value.normalize('NFC').trim().replace(/\s+/g, ' ')
  return normalized === '' ? null : normalized
}

export function isValidExample(value: string | null): boolean {
  return value === null || EXAMPLE_PATTERN.test(value)
}
