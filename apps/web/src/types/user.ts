export interface User {
  id: string
  email: string
  // Date ISO de création du compte : ancienneté affichée sur le profil (CON-71).
  createdAt: string
  // Code de la langue apprise (ex. « EN »), réglée côté back (CON-55).
  learningLanguage: string
}
