import type { ReactNode } from 'react'

interface AccountMilestoneBannerProps {
  message: ReactNode
}

// Même esprit que MilestoneBanner (positif, calme, jamais exubérant), pour
// un jalon "surprise" atteint sur la régularité cumulée du compte plutôt que
// sur le palier du jour d'un deck. Pas de barre de progression ici : il n'y
// a rien à montrer avant que le jalon soit atteint (voir CLAUDE.md).
export function AccountMilestoneBanner({ message }: AccountMilestoneBannerProps) {
  return (
    <div className="flex items-center gap-4 bg-clay-tint border border-clay/25 rounded-lg p-5">
      <span className="shrink-0 text-clay-deep">
        <iconify-icon icon="ph:seal-check-bold" width="26"></iconify-icon>
      </span>
      <p className="font-body text-body-md text-ink m-0">{message}</p>
    </div>
  )
}
