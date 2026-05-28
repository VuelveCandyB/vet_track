import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" style={{ background: '#1e2540' }} />
        <Skeleton className="h-4 w-56" style={{ background: '#1e2540' }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="rounded-xl p-5" style={{ background: '#131829', border: '1px solid #252d4a' }}>
            <Skeleton className="h-3 w-24 mb-3" style={{ background: '#1e2540' }} />
            <Skeleton className="h-9 w-16" style={{ background: '#1e2540' }} />
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl p-5 space-y-3" style={{ background: '#131829', border: '1px solid #252d4a' }}>
          <Skeleton className="h-4 w-24" style={{ background: '#1e2540' }} />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" style={{ background: '#1e2540' }} />
          ))}
        </div>
        <div className="rounded-xl p-5 space-y-3" style={{ background: '#131829', border: '1px solid #252d4a' }}>
          <Skeleton className="h-4 w-32" style={{ background: '#1e2540' }} />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" style={{ background: '#1e2540' }} />
          ))}
        </div>
        <div className="md:col-span-2 rounded-xl p-5 space-y-3" style={{ background: '#131829', border: '1px solid #252d4a' }}>
          <Skeleton className="h-4 w-40" style={{ background: '#1e2540' }} />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" style={{ background: '#1e2540' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
