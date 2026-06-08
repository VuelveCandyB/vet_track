import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" style={{ background: '#86EFAC' }} />
          <Skeleton className="h-4 w-64" style={{ background: '#86EFAC' }} />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" style={{ background: '#86EFAC' }} />
          <Skeleton className="h-8 w-24 rounded-md" style={{ background: '#86EFAC' }} />
        </div>
      </div>
      <Skeleton className="h-20 rounded-xl" style={{ background: '#FFFFFF' }} />
      <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #E2E8F0' }}>
          <Skeleton className="h-4 w-24" style={{ background: '#86EFAC' }} />
        </div>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-4 py-3" style={{ borderBottom: '1px solid #E2E8F0' }}>
            <Skeleton className="h-4 w-36" style={{ background: '#86EFAC' }} />
            <Skeleton className="h-4 w-32" style={{ background: '#86EFAC' }} />
            <Skeleton className="h-4 w-20" style={{ background: '#86EFAC' }} />
            <Skeleton className="h-4 w-24" style={{ background: '#86EFAC' }} />
            <Skeleton className="h-5 w-20 rounded-full" style={{ background: '#86EFAC' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
