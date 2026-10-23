// Codes ISO 639-1 en majuscules ("FR", "EN", "ES"...), tels que renvoyés par l'API.
export interface TranslationResult {
  translation: string
  sourceLang: string
  targetLang: string
  sourceIsFrench: boolean
}
