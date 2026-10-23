import type { MouseEventHandler } from 'react'

type IconButtonIcon = 'edit' | 'delete'

interface IconButtonProps {
  icon: IconButtonIcon
  // Nom de l'action lu par les lecteurs d'écran, ex. « Modifier le deck ».
  label: string
  onClick?: MouseEventHandler<HTMLButtonElement>
}

// Tracés repris de S15-deck (crayon, corbeille), dessinés au trait.
const paths: Record<IconButtonIcon, string> = {
  edit: 'M4 20l1.2-4.6L15.8 4.8a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z M13.5 7l3.5 3.5',
  delete: 'M4.5 6.5h15 M9.5 6.5V4.5h5v2 M6.5 6.5l1 13h9l1-13 M10.5 10v6 M13.5 10v6',
}

// Bouton à icône seule (CON-57) : sans fond, cible tactile de 44px (S15-deck en
// montrait 38, relevé au lot 1).
export function IconButton({ icon, label, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="size-hit shrink-0 inline-flex items-center justify-center p-0 border-none rounded-sm bg-transparent text-inksoft cursor-pointer transition-colors duration-base ease-standard hover:text-indigo hover:bg-indigo-tint"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
        <path d={paths[icon]} stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
