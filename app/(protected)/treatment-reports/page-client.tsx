'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PALETTE } from '@/lib/palette'
import type { TreatmentReport } from '@/lib/types'

interface TreatmentReportsPageClientProps {
  reports: (TreatmentReport & {
    horse?: { name: string; registration?: string }
    drug?: { nombre: string; tipo_restriccion?: string }
  })[]
}

export default function TreatmentReportsPageClient({
  reports,
}: TreatmentReportsPageClientProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-sans)', color: PALETTE.primary.green }}>
            Registros de PMF (Art. 1412)
          </h1>
          <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>
            {reports.length} informe{reports.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/treatment-reports/new">
          <Button
            style={{ background: PALETTE.primary.green, color: '#fff' }}>
            + Nuevo PMF
          </Button>
        </Link>
      </div>

      {/* Tabla */}
      <div className="rounded-lg overflow-hidden" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <div className="px-5 py-3 border-b text-xs" style={{ borderColor: PALETTE.ui.border, color: PALETTE.text.secondary }}>
          {reports.length} resultado{reports.length !== 1 ? 's' : ''}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                {['Caballo', 'Medicamento', 'Fecha fin restricción', 'Hasta cuándo', 'Establo', 'Fecha', 'Vet', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: PALETTE.text.secondary }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!reports.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center" style={{ color: PALETTE.text.secondary }}>
                    Sin informes
                  </td>
                </tr>
              ) : reports.map(report => {
                const isExpired = report.fecha_fin_tratamiento && new Date(report.fecha_fin_tratamiento) < new Date()
                const isUrgent = report.fecha_fin_tratamiento && new Date(report.fecha_fin_tratamiento).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000

                const formatDate = (dateStr: string | null) => {
                  if (!dateStr) return '—'
                  const [year, month, day] = dateStr.split('-')
                  return `${day}/${month}/${year}`
                }

                return (
                  <tr key={report.id}
                    className="transition-colors hover:bg-[#05966920]"
                    style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                    <td className="px-4 py-3 font-semibold">
                      {report.horse?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: PALETTE.primary.green }}>{report.drug?.nombre || '—'}</span>
                      {report.drug?.tipo_restriccion && (
                        <span className="text-xs ml-1" style={{ color: PALETTE.text.secondary }}>
                          [{report.drug.tipo_restriccion}]
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {report.fecha_fin_tratamiento ? (
                        <span style={{
                          color: isExpired ? '#10b981' : isUrgent ? '#f97316' : PALETTE.text.primary,
                          fontWeight: isUrgent ? '600' : 'normal'
                        }}>
                          {formatDate(report.fecha_fin_tratamiento)}
                          {isExpired && ' ✓'}
                          {isUrgent && !isExpired && ' ⚠'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {report.hasta_cuando ? (
                        <div>
                          <div>{formatDate(report.hasta_cuando)}</div>
                          {report.es_auto_generado && (
                            <span style={{ color: '#0891b2', fontSize: '0.7rem' }}>⚙️ auto</span>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">{report.establo || '—'}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(report.fecha_tratamiento)}</td>
                    <td className="px-4 py-3 text-xs">{report.vet_autorizado_nombre}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <Link href={`/treatment-reports/${report.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
