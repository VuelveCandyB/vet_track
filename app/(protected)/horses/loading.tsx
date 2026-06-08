import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" style={{ background: '#86EFAC' }} />
          <Skeleton className="h-4 w-48" style={{ background: '#86EFAC' }} />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" style={{ background: '#86EFAC' }} />
          <Skeleton className="h-9 w-36 rounded-md" style={{ background: '#F0F5F9' }} />
        </div>
      </div>

      {/* Search bar */}
      <Skeleton className="h-9 w-72 rounded-md" style={{ background: '#86EFAC' }} />

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #E2E8F0' }}>
          <Skeleton className="h-4 w-24" style={{ background: '#86EFAC' }} />
        </div>
        <div className="divide-y" style={{ borderColor: '#E2E8F0' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-3">
              <Skeleton className="h-4 w-48" style={{ background: '#86EFAC' }} />
              <Skeleton className="h-4 w-20" style={{ background: '#86EFAC' }} />
              <Skeleton className="h-5 w-20 rounded-full" style={{ background: '#86EFAC' }} />
              <Skeleton className="h-4 w-10" style={{ background: '#86EFAC' }} />
              <Skeleton className="h-4 w-16" style={{ background: '#86EFAC' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
