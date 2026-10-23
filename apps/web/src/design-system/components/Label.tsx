import type { ReactNode } from 'react'

interface LabelProps {
  children: ReactNode
  // Fourni : rendu en <label> rattaché au champ. Sinon, simple étiquette de section.
  htmlFor?: string
  id?: string
  className?: string
}

// Étiquette unique de l'app (CON-57) : Kaisei en petites capitales espacées,
// vermillon. Le texte source garde sa casse normale, les capitales viennent du
// CSS (lecture correcte par les lecteurs d'écran).
const style = 'font-display text-label uppercase tracking-label text-vermillon'

export function Label({ children, htmlFor, id, className }: LabelProps) {
  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} id={id} className={`${style} ${className ?? ''}`}>
        {children}
      </label>
    )
  }
  return (
    <span id={id} className={`${style} ${className ?? ''}`}>
      {children}
    </span>
  )
}
