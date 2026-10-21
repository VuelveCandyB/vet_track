import { requireUser, isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { deleteTreatmentReport } from '@/lib/actions/treatment-reports'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DownloadPdfButton from '@/components/treatment-reports/download-pdf-button'
import { PALETTE } from '@/lib/palette'
import type { TreatmentReport } from '@/lib/types'

async function deleteReport(id: string) {
  'use server'
  await deleteTreatmentReport(id)
}

export default async function TreatmentReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const userIsAdmin = await isAdmin(user.id, user.email!)
  const { id } = await params
  const supabase = await createClient()

  const [reportRes, medicationsRes] = await Promise.all([
    supabase
      .from('treatment_reports')
      .select('*, horse:horses(id, name, registration, microchip)')
      .eq('id', id)
      .single(),
    supabase
      .from('treatment_report_medications')
      .select('*, drug:drugs(nombre, categoria, tipo_restriccion, withdrawal_time_horas, withdrawal_time_dias)')
      .eq('treatment_report_id', id),
  ])

  const { data: report, error } = reportRes
  const { data: medications } = medicationsRes

  if (error || !report) {
    return (
      <div className="p-6 text-red-600">
        Informe no encontrado
      </div>
    )
  }

  // Helper function to convert 24-hour to 12-hour format
  const formatTo12Hour = (timeStr: string | undefined | null) => {
    if (!timeStr) return '—'
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    const isAM = hour < 12
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${m} ${isAM ? 'AM' : 'PM'}`
  }

  // Get veterinarian profile info (search by full name)
  let vetProfile: any = null
  if (report.vet_autorizado_nombre) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, license_number, license_renewal_date')

    if (profiles) {
      const searchName = report.vet_autorizado_nombre.toLowerCase().trim()
      vetProfile = profiles.find((p: any) => {
        const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.toLowerCase().trim()
        // Try exact match first
        if (fullName === searchName) return true
        // Try partial match if first or last name is in the search string
        const firstName = (p.first_name ?? '').toLowerCase().trim()
        const lastName = (p.last_name ?? '').toLowerCase().trim()
        if (firstName && lastName && searchName.includes(firstName) && searchName.includes(lastName)) return true
        return false
      })
    }
  }

  // Get creator (technician) name
  let creatorName: string | null = null
  if (report.created_by) {
    const { data: creator } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', report.created_by)
      .single()

    if (creator) {
      creatorName = `${creator.first_name ?? ''} ${creator.last_name ?? ''}`.trim()
    }
  }

  const typed = report as TreatmentReport & {
    horse?: { id: string; name: string; registration?: string; microchip?: string }
  }

  const typedMeds = (medications || []).map(m => ({
    ...m,
    drug: m.drug as { nombre: string; categoria: string; tipo_restriccion?: string; withdrawal_time_horas?: number; withdrawal_time_dias?: number } | null
  }))

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href={typed.horse?.id ? `/horses/${typed.horse.id}` : '/treatment-reports'}>
          <Button variant="ghost" size="sm">← Volver al caballo</Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: PALETTE.primary.green }}>
            Informe de Tratamiento
          </h1>
          <p className="text-sm" style={{ color: PALETTE.text.secondary }}>
            {typed.horse?.name} • {new Date(typed.fecha_tratamiento).toLocaleDateString('es-ES')}
          </p>
        </div>
        <div className="flex gap-2">
          {(typed.created_by === user.id || userIsAdmin) && (
            <Link href={`/treatment-reports/${id}/edit`}>
              <Button style={{ background: PALETTE.primary.green, color: '#fff' }}>
                Editar
              </Button>
            </Link>
          )}
          <DownloadPdfButton report={typed} medications={typedMeds} />
        </div>
      </div>

      {/* Documento */}
      <div className="rounded-lg p-8" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>

        {/* Sección: Caballo */}
        <div className="mb-8 pb-8" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: PALETTE.text.secondary }}>
            Información del Caballo
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Nombre</p>
              <p className="text-lg font-semibold">{typed.horse?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Número de Identificación</p>
              <p className="text-lg font-semibold">{typed.numero_identificacion_caballo || typed.horse?.registration || typed.horse?.microchip || '—'}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Establo</p>
              <p className="text-lg font-semibold">{typed.establo || '—'}</p>
            </div>
          </div>
        </div>

        {/* Sección: Medicamentos */}
        <div className="mb-8 pb-8" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: PALETTE.text.secondary }}>
            Medicamentos ({typedMeds.length})
          </h2>

          {typedMeds.map((med, idx) => (
            <div key={med.id} className="mb-6 pb-6" style={{ borderBottom: idx < typedMeds.length - 1 ? `1px solid ${PALETTE.ui.border}` : 'none' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: PALETTE.text.primary }}>Medicamento {idx + 1}</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Medicamento</p>
                  <p className="text-lg font-semibold">{med.drug?.nombre || '—'}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Categoría</p>
                  <p className="text-lg font-semibold">{med.drug?.categoria || '—'}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Dosis</p>
                  <p className="text-lg font-semibold">{med.dosis} {med.dosis_unidad || 'mg'}</p>
                </div>
                {med.nivel_dosificacion && (
                  <div>
                    <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Nivel de Dosificación</p>
                    <p className="text-lg font-semibold">{med.nivel_dosificacion}</p>
                  </div>
                )}
                {med.drug?.tipo_restriccion && (
                  <div>
                    <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Restricción</p>
                    <p className="text-lg font-semibold" style={{ color: '#b91c1c' }}>{med.drug.tipo_restriccion}</p>
                  </div>
                )}
                {med.tiempo_restriccion && (
                  <div>
                    <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Tiempo de Restricción</p>
                    <p className="text-lg font-semibold">{med.tiempo_restriccion}h ({Math.round(med.tiempo_restriccion / 24 * 10) / 10} días)</p>
                  </div>
                )}
                {med.created_at && (
                  <div>
                    <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Fecha de Entrada</p>
                    <p className="text-sm font-semibold">{new Date(med.created_at).toLocaleString('es-ES')}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Fecha</p>
              <p className="text-lg font-semibold">{new Date(typed.fecha_tratamiento).toLocaleDateString('es-ES')}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Hora</p>
              <p className="text-lg font-semibold">{formatTo12Hour(typed.hora_tratamiento)}</p>
            </div>
          </div>

          {typed.diagnostico && (
            <div className="mt-6">
              <p className="text-xs mb-1" style={{ color: PALETTE.text.secondary }}>Diagnóstico</p>
              <p className="text-base whitespace-pre-wrap">{typed.diagnostico}</p>
            </div>
          )}
        </div>

        {/* Sección: Auto-generado (si aplica) */}
        {typed.es_auto_generado && (
          <div className="mb-8 pb-8 bg-blue-50 p-4 rounded-md" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: PALETTE.text.secondary }}>
              Generación
            </h2>
            <p className="text-lg font-semibold" style={{ color: '#0891b2' }}>
              ⚙️ Auto-generado
            </p>
          </div>
        )}

        {/* Sección: Vet */}
        <div className="mb-8 pb-8" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: PALETTE.text.secondary }}>
            Veterinario Autorizado
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Nombre</p>
              <p className="text-lg font-semibold">{typed.vet_autorizado_nombre || '—'}</p>
            </div>
            {vetProfile?.license_number && (
              <div>
                <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Licencia</p>
                <p className="text-lg font-semibold">{vetProfile.license_number}</p>
              </div>
            )}
            {vetProfile?.license_renewal_date && (
              <div>
                <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Renovación de Licencia</p>
                <p className="text-lg font-semibold">{new Date(vetProfile.license_renewal_date).toLocaleDateString('es-ES')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sección: Notas */}
        {typed.notas && (
          <div className="mb-8 pb-8" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: PALETTE.text.secondary }}>
              Notas Adicionales
            </h2>
            <p className="text-base whitespace-pre-wrap">{typed.notas}</p>
          </div>
        )}

        {/* Sección: Auditoría */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: PALETTE.text.secondary }}>
            Auditoría
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p style={{ color: PALETTE.text.secondary }}>Creado por</p>
              <p className="font-semibold">{creatorName || '—'}</p>
            </div>
            <div>
              <p style={{ color: PALETTE.text.secondary }}>Fecha de Creación</p>
              <p className="font-semibold">{typed.created_at ? new Date(typed.created_at).toLocaleString('es-ES') : '—'}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
