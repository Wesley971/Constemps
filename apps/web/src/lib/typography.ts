// Typographie française (CON-57) : espace fine insécable avant ? ! ; : et à
// l'intérieur des guillemets « », pour qu'une ponctuation haute ne se retrouve
// jamais seule en début de ligne. À appliquer aux textes venus de l'API (messages
// de l'IA notamment) ; les textes de l'interface sont écrits directement ainsi.
const NARROW_NBSP = ' '

export function frenchSpacing(text: string): string {
  return text
    .replace(/[   ]*([?!;:»])/g, (match: string, punct: string, offset: number, full: string) => {
      const previous = full[offset - 1] ?? ''
      // Pas d'espace en début de texte, dans une suite « ?! », ni dans une heure (« 10:30 »).
      const isTime = punct === ':' && match === ':' && /\d/.test(previous)
      if (offset === 0 || /[?!]/.test(previous) || isTime) return match.trimStart()
      return `${NARROW_NBSP}${punct}`
    })
    .replace(/«[   ]*/g, `«${NARROW_NBSP}`)
}
