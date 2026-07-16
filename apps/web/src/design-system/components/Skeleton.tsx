interface SkeletonProps {
  width?: number | string
  height?: number | string
  radius?: string
}

export function Skeleton({ width = '100%', height = 16, radius = 'var(--radius-xs)' }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'var(--line)',
        animation: 'dsSkeletonPulse 1.4s ease-in-out infinite',
      }}
    />
  )
}
