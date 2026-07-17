import { Skeleton } from '@/components/ui/skeleton'
import { PALETTE } from '@/lib/palette'

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-7 w-40" style={{ background: '#86EFAC' }} />
        <Skeleton className="h-4 w-56" style={{ background: '#86EFAC' }} />
      </div>

      {/* Stats Strip — 6 items, grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 py-6 md:py-8 border-b" style={{ borderColor: PALETTE.ui.border }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="text-center space-y-2 flex flex-col items-center">
            <Skeleton className="h-8 w-12" style={{ background: '#86EFAC' }} />
            <Skeleton className="h-3 w-16" style={{ background: '#86EFAC' }} />
          </div>
        ))}
      </div>

      {/* Sections Stack — 3 full-width apiladas */}
      <div className="space-y-8 mt-8">
        {[
          { rows: 5, cols: '140px 200px 1fr 120px' },
          { rows: 5, cols: '140px 200px 1fr 120px' },
          { rows: 8, cols: '140px 200px 1fr 160px' },
        ].map((section, si) => (
          <div key={si} className="section">
            <Skeleton className="h-3 w-32 mb-3" style={{ background: '#86EFAC' }} />
            <div className="rounded-lg border overflow-hidden" style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border }}>
              <div style={{ background: '#f8fafc', borderBottom: `1px solid ${PALETTE.ui.border}` }} className="px-4 py-2.5">
                <Skeleton className="h-3 w-24" style={{ background: '#86EFAC' }} />
              </div>
              {[...Array(section.rows)].map((_, ri) => (
                <div key={ri} className="grid gap-4 px-4 py-3 items-center"
                  style={{ gridTemplateColumns: section.cols, borderBottom: ri < section.rows - 1 ? `1px solid ${PALETTE.ui.border}` : 'none' }}>
                  <Skeleton className="h-4 w-20" style={{ background: '#86EFAC' }} />
                  <Skeleton className="h-4 w-32" style={{ background: '#86EFAC' }} />
                  <div />
                  <Skeleton className="h-4 w-16 justify-self-end" style={{ background: '#86EFAC' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
