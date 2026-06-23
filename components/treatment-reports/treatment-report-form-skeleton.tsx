import { PALETTE } from '@/lib/palette'

export function TreatmentReportFormSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* SECCIÓN 1 */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="h-4 w-32 rounded animate-pulse mb-6" style={{ background: '#E2E8F0' }}></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-20 rounded animate-pulse" style={{ background: '#E2E8F0' }}></div>
            <div className="h-9 rounded-md animate-pulse" style={{ background: '#F1F5F9' }}></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 rounded animate-pulse" style={{ background: '#E2E8F0' }}></div>
            <div className="h-9 rounded-md animate-pulse" style={{ background: '#F1F5F9' }}></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 rounded animate-pulse" style={{ background: '#E2E8F0' }}></div>
            <div className="h-9 rounded-md animate-pulse" style={{ background: '#F1F5F9' }}></div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2 */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="h-4 w-24 rounded animate-pulse mb-6" style={{ background: '#E2E8F0' }}></div>
        <div className="space-y-2">
          <div className="h-4 w-20 rounded animate-pulse" style={{ background: '#E2E8F0' }}></div>
          <div className="h-9 rounded-md animate-pulse" style={{ background: '#F1F5F9' }}></div>
        </div>
      </div>

      {/* SECCIÓN 3 */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="h-4 w-40 rounded animate-pulse mb-6" style={{ background: '#E2E8F0' }}></div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-20 rounded animate-pulse" style={{ background: '#E2E8F0' }}></div>
            <div className="h-20 rounded-md animate-pulse" style={{ background: '#F1F5F9' }}></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 rounded animate-pulse" style={{ background: '#E2E8F0' }}></div>
            <div className="h-20 rounded-md animate-pulse" style={{ background: '#F1F5F9' }}></div>
          </div>
        </div>
      </div>

      {/* BOTONES */}
      <div className="flex gap-3 pt-6 justify-center md:justify-start">
        <div className="h-10 w-32 rounded-md animate-pulse" style={{ background: '#E2E8F0' }}></div>
        <div className="h-10 w-24 rounded-md animate-pulse" style={{ background: '#E2E8F0' }}></div>
      </div>
    </div>
  )
}
