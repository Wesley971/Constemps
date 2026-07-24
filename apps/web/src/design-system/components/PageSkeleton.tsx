import { Skeleton } from './Skeleton'

export function PageSkeleton() {
  return (
    <div className="max-w-wrap mx-auto flex flex-col gap-4 pt-5">
      <Skeleton className="w-[220px] h-7" />
      <Skeleton className="w-full h-20" radius="tile" />
      <Skeleton className="w-full h-20" radius="tile" />
      <Skeleton className="w-full h-20" radius="tile" />
    </div>
  )
}
