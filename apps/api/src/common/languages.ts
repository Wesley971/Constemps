// Seule source de vérité des langues gérées par la traduction (CON-55) : toute
// nouvelle langue s'ajoute ici, et le défaut "EN" de User.learningLanguage dans
// schema.prisma doit rester aligné sur DEFAULT_LEARNING_LANGUAGE.
export const SUPPORTED_LANGUAGES = ['FR', 'EN'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Langue de l'utilisateur : tout recto saisi dans une autre langue est traduit
// vers elle, et un recto saisi dans cette langue part vers learningLanguage.
export const NATIVE_LANGUAGE: SupportedLanguage = 'FR';

// Constante de référence, non importée par le code : schema.prisma ne peut pas
// l'utiliser (Prisma n'accepte qu'une valeur littérale), son @default("EN") sur
// User.learningLanguage doit donc être tenu aligné à la main sur cette valeur.
export const DEFAULT_LEARNING_LANGUAGE: SupportedLanguage = 'EN';

// Une langue d'apprentissage égale à la langue native donnerait une traduction
// FR -> FR, exactement le bug d'origine de CON-55 : on la refuse.
export function isValidLearningLanguage(
  value: string,
): value is SupportedLanguage {
  return (
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value) &&
    value !== NATIVE_LANGUAGE
  );
}
