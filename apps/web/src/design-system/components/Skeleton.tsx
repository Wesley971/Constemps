type SkeletonRadius = 'xs' | 'lg' | 'pill' | 'full'

interface SkeletonProps {
  radius?: SkeletonRadius
  className?: string
}

const radiusClasses: Record<SkeletonRadius, string> = {
  xs: 'rounded-xs',
  lg: 'rounded-lg',
  pill: 'rounded-pill',
  full: 'rounded-full',
}

export function Skeleton({ radius = 'xs', className }: SkeletonProps) {
  return <div className={`bg-paper-sunken animate-skeleton-pulse ${radiusClasses[radius]} ${className ?? ''}`} />
}
