import type { ReactNode } from 'react'
import { ProgressBar } from './ProgressBar'

interface MilestoneBannerProps {
  message: ReactNode
  action?: ReactNode
}

/** MilestoneBanner — état "palier atteint" : positif mais calme, jamais exubérant. */
export function MilestoneBanner({ message, action }: MilestoneBannerProps) {
  return (
    <div className="text-center flex flex-col gap-5 items-center">
      <div className="w-full">
        <ProgressBar value={100} label="Palier du jour" tone="positive" />
      </div>
      <p className="font-body text-body-md text-ink m-0 max-w-95">{message}</p>
      {action}
    </div>
  )
}
