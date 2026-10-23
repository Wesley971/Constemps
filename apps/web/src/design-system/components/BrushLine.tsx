interface BrushLineProps {
  error?: boolean
}

// Trait au pinceau sous un champ (CON-57). Discret au repos, marqué quand le
// champ parent (classe "group") a le focus. Couleur héritée de currentColor.
// Au repos : 60 % et non 35 % comme sur les planches, pour atteindre le contraste
// de 3:1 exigé pour délimiter un champ (WCAG 1.4.11) ; 35 % ne donnait que 1,9:1.
export function BrushLine({ error }: BrushLineProps) {
  const tone = error ? 'text-danger opacity-90' : 'text-indigo opacity-60 group-focus-within:opacity-90'
  return (
    <svg
      viewBox="0 0 300 6"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block w-full h-2 transition-opacity duration-base ease-standard ${tone}`}
    >
      <path d="M2 3.4C60 2 180 2.1 296 2.8 200 4.6 80 4.8 4 4.1z" fill="currentColor" />
    </svg>
  )
}
