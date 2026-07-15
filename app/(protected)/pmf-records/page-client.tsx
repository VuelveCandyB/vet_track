'use client'
import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PALETTE } from '@/lib/palette'
import { radicatePMFRecord } from '@/lib/actions/pmf-records'
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
    horses?: { name: string; registration?: string }
    drug?: { nombre: string; tipo_restriccion?: string }
  })[]
  currentEstado?: string
  isAdmin: boolean
}

export default function TreatmentReportsPageClient({
  reports,
  currentEstado,
  isAdmin,
}: TreatmentReportsPageClientProps) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handleRadicate = (id: string) => {
    setPendingId(id)
    startTransition(async () => {
      try {
        await radicatePMFRecord(id)
        setPendingId(null)
      } catch (err) {
        alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setPendingId(null)
      }
    })
  }

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
        <Link href="/pmf-records/new">
          <Button
            style={{ background: PALETTE.primary.green, color: '#fff' }}>
            + Nuevo PMF
          </Button>
        </Link>
      </div>

      {/* Filtros por estado */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <Link href="/pmf-records">
          <Button
            variant={!currentEstado ? 'default' : 'secondary'}
            size="sm"
          >
            Todos
          </Button>
        </Link>
        {['borrador', 'sometido', 'radicado'].map(e => (
          <Link key={e} href={`/pmf-records?estado=${e}`}>
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
                {['Caballo', 'Fecha Creación', 'Estado', 'Acciones'].map(h => (
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
                  <td colSpan={4} className="px-4 py-12 text-center" style={{ color: PALETTE.text.secondary }}>
                    Sin informes {currentEstado ? `en estado "${ESTADO_LABEL[currentEstado]}"` : ''}
                  </td>
                </tr>
              ) : reports.map(report => {
                const isExpired = report.fecha_fin_tratamiento && new Date(report.fecha_fin_tratamiento) < new Date()
                const isUrgent = report.fecha_fin_tratamiento && new Date(report.fecha_fin_tratamiento).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000

                const formatDate = (dateStr: string | null) => {
                  if (!dateStr) return '—'
                  // Parse YYYY-MM-DD format and show as DD/MM/YYYY
                  const [year, month, day] = dateStr.split('-')
                  return `${day}/${month}/${year}`
                }

                const formatDateTime = (dateTimeStr: string | null) => {
                  if (!dateTimeStr) return '—'
                  // Parse ISO format and show as DD/MM/YYYY HH:MM AM/PM
                  const date = new Date(dateTimeStr)
                  const day = String(date.getDate()).padStart(2, '0')
                  const month = String(date.getMonth() + 1).padStart(2, '0')
                  const year = date.getFullYear()
                  let hours = date.getHours()
                  const minutes = String(date.getMinutes()).padStart(2, '0')
                  const ampm = hours >= 12 ? 'PM' : 'AM'
                  hours = hours % 12 || 12
                  const hoursStr = String(hours).padStart(2, '0')
                  return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`
                }

                // Verificar si el informe es urgente (creado hace > 24 horas)
                const isUrgentForRadication = report.estado === 'sometido' &&
                  report.created_at &&
                  new Date().getTime() - new Date(report.created_at).getTime() > 20 * 60 * 60 * 1000

                return (
                  <tr key={report.id}
                    className="transition-colors hover:bg-[#05966920]"
                    style={{
                      borderBottom: `1px solid ${PALETTE.ui.border}`,
                      backgroundColor: isUrgentForRadication ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                    }}>
                    <td className="px-4 py-3 font-semibold">
                      {report.horses?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {report.created_at ? formatDate(report.created_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs border ${ESTADO_COLOR[report.estado] ?? ''}`}>
                        {ESTADO_LABEL[report.estado] ?? report.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      {isAdmin && report.estado === 'sometido' && (
                        <Button
                          size="sm"
                          disabled={pendingId === report.id}
                          onClick={() => handleRadicate(report.id)}
                          style={{ background: PALETTE.primary.green, color: '#fff' }}
                        >
                          {pendingId === report.id ? 'Radicando...' : 'Radicar'}
                        </Button>
                      )}
                      <Link href={`/pmf-records/${report.id}`}>
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
