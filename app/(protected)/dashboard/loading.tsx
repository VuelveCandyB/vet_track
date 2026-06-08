import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" style={{ background: '#86EFAC' }} />
        <Skeleton className="h-4 w-56" style={{ background: '#86EFAC' }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="rounded-lg p-5" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <Skeleton className="h-3 w-24 mb-3" style={{ background: '#86EFAC' }} />
            <Skeleton className="h-9 w-16" style={{ background: '#86EFAC' }} />
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg p-5 space-y-3" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <Skeleton className="h-4 w-24" style={{ background: '#86EFAC' }} />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" style={{ background: '#86EFAC' }} />
          ))}
        </div>
        <div className="rounded-lg p-5 space-y-3" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <Skeleton className="h-4 w-32" style={{ background: '#86EFAC' }} />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" style={{ background: '#86EFAC' }} />
          ))}
        </div>
        <div className="md:col-span-2 rounded-lg p-5 space-y-3" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <Skeleton className="h-4 w-40" style={{ background: '#86EFAC' }} />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" style={{ background: '#86EFAC' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
