export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
      <div className="mb-2 flex gap-2">
        <div className="h-5 w-24 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-5 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
      <div className="mb-1 h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="mb-1 h-3 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="mt-3 flex justify-between">
        <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-3 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
  )
}

export function SkeletonFeed({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
