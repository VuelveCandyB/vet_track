import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" style={{ background: '#1e2540' }} />
          <Skeleton className="h-4 w-48" style={{ background: '#1e2540' }} />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" style={{ background: '#1e2540' }} />
          <Skeleton className="h-9 w-36 rounded-md" style={{ background: '#2B55F440' }} />
        </div>
      </div>

      {/* Search bar */}
      <Skeleton className="h-9 w-72 rounded-md" style={{ background: '#1e2540' }} />

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#131829', border: '1px solid #252d4a' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #252d4a' }}>
          <Skeleton className="h-4 w-24" style={{ background: '#1e2540' }} />
        </div>
        <div className="divide-y" style={{ borderColor: '#1e2235' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-3">
              <Skeleton className="h-4 w-48" style={{ background: '#1e2540' }} />
              <Skeleton className="h-4 w-20" style={{ background: '#1e2540' }} />
              <Skeleton className="h-5 w-20 rounded-full" style={{ background: '#1e2540' }} />
              <Skeleton className="h-4 w-10" style={{ background: '#1e2540' }} />
              <Skeleton className="h-4 w-16" style={{ background: '#1e2540' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
