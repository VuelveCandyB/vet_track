import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" style={{ background: '#1e2540' }} />
        <Skeleton className="h-4 w-64" style={{ background: '#1e2540' }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" style={{ background: '#131829' }} />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" style={{ background: '#131829' }} />
    </div>
  )
}
