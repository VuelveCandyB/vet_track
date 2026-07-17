import { requireUser } from '@/lib/auth'
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
  const { id } = await params
  const supabase = await createClient()

  const { data: report, error } = await supabase
    .from('treatment_reports')
    .select('*, horse:horses(id, name, registration, microchip), drug:drugs(nombre, categoria, tipo_restriccion, withdrawal_time_horas)')
    .eq('id', id)
    .single()

  if (error || !report) {
    return (
      <div className="p-6 text-red-600">
        Informe no encontrado
      </div>
    )
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

  const typed = report as TreatmentReport & {
    horse?: { id: string; name: string; registration?: string; microchip?: string }
    drug?: { nombre: string; categoria: string; tipo_restriccion?: string; withdrawal_time_horas?: number }
  }

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
        <div>
          <DownloadPdfButton report={typed} />
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

        {/* Sección: Tratamiento */}
        <div className="mb-8 pb-8" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: PALETTE.text.secondary }}>
            Información del Tratamiento
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Medicamento</p>
              <p className="text-lg font-semibold">{typed.drug?.nombre || '—'}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Categoría</p>
              <p className="text-lg font-semibold">{typed.drug?.categoria || '—'}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Dosis</p>
              <p className="text-lg font-semibold">{typed.dosis} {typed.dosis_unidad || 'mg'}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Nivel de Dosificación</p>
              <p className="text-lg font-semibold">{typed.nivel_dosificacion || '—'}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Fecha</p>
              <p className="text-lg font-semibold">{new Date(typed.fecha_tratamiento).toLocaleDateString('es-ES')}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Hora</p>
              <p className="text-lg font-semibold">{typed.hora_tratamiento}</p>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-xs mb-1" style={{ color: PALETTE.text.secondary }}>Diagnóstico</p>
            <p className="text-base whitespace-pre-wrap">{typed.diagnostico || '—'}</p>
          </div>
          {typed.tratamiento && (
            <div>
              <p className="text-xs mb-1" style={{ color: PALETTE.text.secondary }}>Tratamiento</p>
              <p className="text-base whitespace-pre-wrap">{typed.tratamiento}</p>
            </div>
          )}
        </div>

        {/* Sección: Restricciones (si aplica) */}
        {typed.drug?.tipo_restriccion && (
          <div className="mb-8 pb-8 bg-yellow-50 p-4 rounded-md" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: PALETTE.text.secondary }}>
              Restricciones
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Tipo de Restricción</p>
                <p className="text-lg font-semibold">{typed.drug?.tipo_restriccion || '—'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Tiempo de Restricción (horas)</p>
                <p className="text-lg font-semibold">{typed.tiempo_restriccion || '—'}</p>
              </div>
              {typed.fecha_fin_tratamiento && (
                <div>
                  <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Fecha Fin de Restricción</p>
                  <p className="text-lg font-semibold">{new Date(typed.fecha_fin_tratamiento).toLocaleDateString('es-ES')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sección: Duración del Tratamiento (Art. 811d) */}
        {typed.hasta_cuando && (
          <div className="mb-8 pb-8 bg-blue-50 p-4 rounded-md" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: PALETTE.text.secondary }}>
              Duración del Tratamiento (Art. 811d)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Hasta cuándo</p>
                <p className="text-lg font-semibold">{new Date(typed.hasta_cuando).toLocaleDateString('es-ES')}</p>
              </div>
              {typed.es_auto_generado && (
                <div>
                  <p className="text-xs" style={{ color: PALETTE.text.secondary }}>Generación</p>
                  <p className="text-lg font-semibold" style={{ color: '#0891b2' }}>
                    ⚙️ Auto-generado
                  </p>
                </div>
              )}
            </div>
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
          <div className="text-xs">
            <p style={{ color: PALETTE.text.secondary }}>Creado</p>
            <p className="font-semibold">{typed.created_at ? new Date(typed.created_at).toLocaleString('es-ES') : '—'}</p>
          </div>
        </div>
      </div>

    </div>
  )
}
