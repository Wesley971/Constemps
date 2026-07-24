type SkeletonRadius = 'xs' | 'tile' | 'pill' | 'full'

interface SkeletonProps {
  radius?: SkeletonRadius
  className?: string
}

const radiusClasses: Record<SkeletonRadius, string> = {
  xs: 'rounded-xs',
  tile: 'rounded-tile',
  pill: 'rounded-pill',
  full: 'rounded-full',
}

export function Skeleton({ radius = 'xs', className }: SkeletonProps) {
  return <div className={`bg-line animate-skeleton-pulse ${radiusClasses[radius]} ${className ?? ''}`} />
}
