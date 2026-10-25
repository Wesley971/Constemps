// Prénom (CON-76) : mêmes règles et même message que le front
// (apps/web/src/lib/profile.ts), toute modification se reporte des deux côtés.
// Partagé par le profil (UpdateProfileDto) et l'inscription (RegisterDto, CON-56).
export const FIRST_NAME_MAX_LENGTH = 40;
// Une seule règle, pour un seul message : 1 à 40 caractères, lettres de toutes
// les langues (accents compris), espaces, traits d'union, apostrophes droite et
// typographique, et au moins une lettre. Matches refuse aussi une valeur qui
// n'est pas une chaîne.
export const FIRST_NAME_PATTERN = new RegExp(
  `^(?=.{1,${FIRST_NAME_MAX_LENGTH}}$)(?=.*\\p{L})[\\p{L}\\p{M} '’-]+$`,
  'u',
);
export const FIRST_NAME_MESSAGE = `Le prénom ne peut contenir que des lettres, des espaces, des traits d'union et des apostrophes (${FIRST_NAME_MAX_LENGTH} caractères au plus).`;

// Normalisation avant validation : forme NFC (une lettre accentuée compte pour
// un caractère), espaces retirés aux bords et réduits à un seul à l'intérieur.
// Un champ vidé devient null : pas de prénom, le profil revient à l'e-mail.
export function normalizeFirstName(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.normalize('NFC').trim().replace(/\s+/g, ' ');
  return normalized === '' ? null : normalized;
}
