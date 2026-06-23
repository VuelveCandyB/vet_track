'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PALETTE } from '@/lib/palette'
import type { TreatmentReport } from '@/lib/types'

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  sometido: 'Sometido',
  radicado: 'Radicado',
}

const ESTADO_COLOR: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-800 border-gray-300',
  sometido: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  radicado: 'bg-green-100 text-green-800 border-green-300',
}

interface TreatmentReportsPageClientProps {
  reports: (TreatmentReport & {
    horse?: { name: string; registration?: string }
    drug?: { nombre: string; tipo_restriccion?: string }
  })[]
  currentEstado?: string
}

export default function TreatmentReportsPageClient({
  reports,
  currentEstado,
}: TreatmentReportsPageClientProps) {

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-sans)', color: PALETTE.primary.green }}>
            Informes de Tratamiento (Art. 811)
          </h1>
          <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>
            {reports.length} informe{reports.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/treatment-reports/new">
          <Button
            style={{ background: PALETTE.primary.green, color: '#fff' }}>
            + Nuevo Informe
          </Button>
        </Link>
      </div>

      {/* Filtros por estado */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <Link href="/treatment-reports">
          <Button
            variant={!currentEstado ? 'default' : 'secondary'}
            size="sm"
          >
            Todos
          </Button>
        </Link>
        {['borrador', 'sometido', 'radicado'].map(e => (
          <Link key={e} href={`/treatment-reports?estado=${e}`}>
            <Button
              variant={currentEstado === e ? 'default' : 'secondary'}
              size="sm"
            >
              {ESTADO_LABEL[e]}
            </Button>
          </Link>
        ))}
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
                {['Caballo', 'Medicamento', 'Establo', 'Fecha', 'Vet', 'Estado', 'Acciones'].map(h => (
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
                  <td colSpan={7} className="px-4 py-12 text-center" style={{ color: PALETTE.text.secondary }}>
                    Sin informes {currentEstado ? `en estado "${ESTADO_LABEL[currentEstado]}"` : ''}
                  </td>
                </tr>
              ) : reports.map(report => (
                <tr key={report.id}
                  className="transition-colors hover:bg-[#05966920]"
                  style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                  <td className="px-4 py-3 font-semibold">{report.horse?.name || '—'}</td>
                  <td className="px-4 py-3">{report.drug?.nombre || '—'}</td>
                  <td className="px-4 py-3">{report.establo || '—'}</td>
                  <td className="px-4 py-3 text-xs">{report.fecha_tratamiento}</td>
                  <td className="px-4 py-3 text-xs">{report.vet_autorizado_nombre}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs border ${ESTADO_COLOR[report.estado] ?? ''}`}>
                      {ESTADO_LABEL[report.estado] ?? report.estado}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/treatment-reports/${report.id}`}>
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
