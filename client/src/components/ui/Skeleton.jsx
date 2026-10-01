function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-line/80 ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <Bone className="h-36 w-full" />
      <Bone className="mt-4 h-4 w-2/3" />
      <Bone className="mt-2 h-3 w-1/2" />
    </div>
  )
}

export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, index) => <Bone key={index} className="h-16 w-full" />)}
    </div>
  )
}

export function SkeletonTable() {
  return <SkeletonList count={6} />
}

export function SkeletonProduct() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Bone className="h-80 w-full" />
      <div>
        <Bone className="h-8 w-2/3" />
        <Bone className="mt-4 h-4 w-1/3" />
        <Bone className="mt-6 h-11 w-40" />
      </div>
    </div>
  )
}

export function SkeletonShop() {
  return (
    <div>
      <Bone className="h-48 w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

export default function Skeleton() {
  return <Bone className="h-8 w-full" />
}
