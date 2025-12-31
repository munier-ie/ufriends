export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-20 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded" />
        ))}
      </div>
      <div className="h-96 bg-muted animate-pulse rounded" />
    </div>
  )
}
