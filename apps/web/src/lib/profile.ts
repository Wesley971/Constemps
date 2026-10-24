import { plural } from './today'

// Libellés tirés du navigateur plutôt que d'une liste locale : la liste des
// langues gérées vit uniquement côté back (CON-55), et la langue source
// détectée par la traduction peut être n'importe laquelle (espagnol, italien...).
const languageNames = new Intl.DisplayNames(['fr'], { type: 'language' })

export function languageLabel(code: string): string {
  try {
    return languageNames.of(code.toLowerCase()) ?? code
  } catch {
    return code
  }
}

// Prénom (CON-76) : mêmes règles et même message que l'API
// (apps/api/src/auth/dto/update-profile.dto.ts), toute modification se reporte
// des deux côtés. 1 à 40 caractères, lettres de toutes les langues, espaces,
// traits d'union, apostrophes droite et typographique, au moins une lettre.
const FIRST_NAME_MAX_LENGTH = 40
const FIRST_NAME_PATTERN = new RegExp(`^(?=.{1,${FIRST_NAME_MAX_LENGTH}}$)(?=.*\\p{L})[\\p{L}\\p{M} '’-]+$`, 'u')
export const FIRST_NAME_MESSAGE = `Le prénom ne peut contenir que des lettres, des espaces, des traits d'union et des apostrophes (${FIRST_NAME_MAX_LENGTH} caractères au plus).`

// Même normalisation que l'API : forme NFC, espaces retirés aux bords et
// réduits à un seul. Chaîne vide : null, le prénom est effacé.
export function normalizeFirstName(value: string): string | null {
  const normalized = value.normalize('NFC').trim().replace(/\s+/g, ' ')
  return normalized === '' ? null : normalized
}

export function isValidFirstName(value: string | null): boolean {
  return value === null || FIRST_NAME_PATTERN.test(value)
}

// Initiales du sceau tirées du prénom : premières lettres des deux premières
// parties (espaces et traits d'union, pas l'apostrophe) : « Jean-Pierre » donne
// « JP », « Wesley » « W », « D'Arcy » « D ».
export function initialsFromFirstName(firstName: string): string {
  const parts = firstName.split(/[\s-]+/).filter(Boolean)
  return parts
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? '')
    .join('')
    .toLocaleUpperCase('fr')
}

// Initiales du sceau du profil (CON-71), tirées de l'e-mail tant que le compte
// n'a pas de prénom (CON-76) : « jean.dupont@… » donne « JD », « test@… » « TE ».
export function initialsFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const words = local.split(/[^\p{L}]+/u).filter(Boolean)
  if (words.length === 0) return local.slice(0, 2).toUpperCase() || '?'
  const initials = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)
  return initials.toUpperCase()
}

// Mois calendaires entiers écoulés entre deux dates locales : du 31 janvier au
// 28 février, le mois n'est pas encore complet.
function fullMonthsBetween(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  if (to.getDate() < from.getDate()) months -= 1
  return Math.max(0, months)
}

// Jours calendaires locaux : un compte créé ce matin reste « depuis aujourd'hui »
// jusqu'à minuit, quel que soit le décalage horaire avec l'UTC du serveur.
function calendarDaysBetween(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000))
}

// « Avec Constemps depuis… » (CON-71) : aujourd'hui, N jours jusqu'à 13 jours,
// N semaines, N mois, puis N an(s) à partir de 12 mois.
export function memberSinceLabel(createdAt: string | Date, now: Date = new Date()): string {
  const from = new Date(createdAt)
  const days = calendarDaysBetween(from, now)
  const months = fullMonthsBetween(from, now)

  if (months >= 12) {
    const years = Math.floor(months / 12)
    return `depuis ${years} ${plural(years, 'an', 'ans')}`
  }
  if (months >= 1) return `depuis ${months} mois`
  if (days >= 14) {
    const weeks = Math.floor(days / 7)
    return `depuis ${weeks} ${plural(weeks, 'semaine', 'semaines')}`
  }
  if (days >= 1) return `depuis ${days} ${plural(days, 'jour', 'jours')}`
  return 'depuis aujourd’hui'
}
