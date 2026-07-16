import { Skeleton } from './Skeleton'

export function PageSkeleton() {
  return (
    <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 20 }}>
      <Skeleton width={220} height={28} />
      <Skeleton height={80} radius="var(--radius-tile)" />
      <Skeleton height={80} radius="var(--radius-tile)" />
      <Skeleton height={80} radius="var(--radius-tile)" />
    </div>
  )
}
