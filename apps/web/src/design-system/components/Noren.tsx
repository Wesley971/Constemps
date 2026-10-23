interface NorenProps {
  // tall : rideau plus long de l'écran de connexion.
  tall?: boolean
}

// Rideau d'en-tête (noren, CON-57) : trois pans indigo en haut de chaque écran,
// bas arrondis, séparés de 4px. Purement décoratif.
export function Noren({ tall }: NorenProps) {
  return (
    <div aria-hidden="true" className={`relative grid grid-cols-3 gap-1 shrink-0 ${tall ? 'h-noren-tall' : 'h-noren'}`}>
      <div className="bg-indigo rounded-b-lg" />
      <div className="bg-indigo rounded-b-lg" />
      <div className="bg-indigo rounded-b-lg" />
    </div>
  )
}
