// Sceau vermillon du profil (CON-71, S14-profil) : initiales sur un carré penché
// aux coins irréguliers (effet de tampon), double liseré vermillon puis papier.
// Décoratif : le nom ou l'e-mail est écrit à côté.
export function Seal({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden="true"
      data-surface="paper"
      className="seal-stamp size-18 shrink-0 flex items-center justify-center -rotate-4 rounded-seal bg-vermillon shadow-seal text-on-accent font-display text-display-lg"
    >
      {initials}
    </span>
  )
}
