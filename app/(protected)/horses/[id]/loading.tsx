import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div>
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-32 mb-4" style={{ background: '#1e2540' }} />

      {/* Horse header */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" style={{ background: '#1e2540' }} />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" style={{ background: '#1e2540' }} />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" style={{ background: '#1e2540' }} />
            <Skeleton className="h-5 w-20 rounded-full" style={{ background: '#1e2540' }} />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-9 w-36 rounded-md" style={{ background: '#1e2540' }} />
        <div className="flex-1" />
        <Skeleton className="h-9 w-24 rounded-md" style={{ background: '#1e2540' }} />
        <Skeleton className="h-9 w-44 rounded-md" style={{ background: '#2B55F440' }} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Left panel */}
        <div className="space-y-4">
          <div className="rounded-xl p-5 space-y-3" style={{ background: '#131829', border: '1px solid #252d4a' }}>
            <Skeleton className="h-4 w-24" style={{ background: '#1e2540' }} />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex justify-between py-2" style={{ borderBottom: '1px solid #1e2235' }}>
                <Skeleton className="h-3 w-20" style={{ background: '#1e2540' }} />
                <Skeleton className="h-3 w-24" style={{ background: '#1e2540' }} />
              </div>
            ))}
          </div>
          <div className="rounded-xl p-5 space-y-3" style={{ background: '#131829', border: '1px solid #252d4a' }}>
            <Skeleton className="h-4 w-28" style={{ background: '#1e2540' }} />
            <div className="flex justify-between py-2">
              <Skeleton className="h-3 w-24" style={{ background: '#1e2540' }} />
              <Skeleton className="h-8 w-12" style={{ background: '#1e2540' }} />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl p-6 space-y-5" style={{ background: '#131829', border: '1px solid #252d4a' }}>
          <div className="flex justify-between">
            <Skeleton className="h-5 w-36" style={{ background: '#1e2540' }} />
            <div className="flex gap-1">
              <Skeleton className="h-7 w-28 rounded-md" style={{ background: '#1e2540' }} />
              <Skeleton className="h-7 w-28 rounded-md" style={{ background: '#1e2540' }} />
            </div>
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg p-4 space-y-3" style={{ background: '#13162080', border: '1px solid #2a2d3e' }}>
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-32" style={{ background: '#1e2540' }} />
                  <Skeleton className="h-5 w-20 rounded-full" style={{ background: '#1e2540' }} />
                </div>
                <Skeleton className="h-4 w-24" style={{ background: '#1e2540' }} />
              </div>
              <div className="flex gap-5">
                <Skeleton className="h-4 w-24" style={{ background: '#1e2540' }} />
                <Skeleton className="h-4 w-20" style={{ background: '#1e2540' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
