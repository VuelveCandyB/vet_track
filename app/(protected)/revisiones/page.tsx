import { createClient } from '@/lib/supabase/server'
import { requireUser, can } from '@/lib/auth'
import { PALETTE } from '@/lib/palette'
import Link from 'next/link'
import RevisionesTree from '@/components/revisiones/revisiones-tree'

export default async function RevisionesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const user = await requireUser()
  const allowed = await can(user, 'page.revisiones', 'full')
  if (!allowed) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="text-center text-red-600">Acceso denegado</div>
      </div>
    )
  }

  const supabase = await createClient()
  const tab = (await searchParams).tab || 'pendientes'
  const today = new Date().toISOString().split('T')[0]
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStartIso = weekStart.toISOString().split('T')[0]

  // Helper function to convert 24-hour to 12-hour format
  const formatTo12Hour = (timeStr: string | undefined | null) => {
    if (!timeStr) return '—'
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    const isAM = hour < 12
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${m} ${isAM ? 'AM' : 'PM'}`
  }

  // Get technicians who created treatments for this vet (any technician across the system)
  const { data: treatments_for_vet } = await supabase
    .from('treatment_reports')
    .select('created_by')
    .eq('created_for_vet_id', user.id)

  const technicianIds = [...new Set(treatments_for_vet?.map(t => t.created_by) ?? [])]

  let technicianMap = new Map<string, string>()
  if (technicianIds.length > 0) {
    const { data: technicians } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', technicianIds)
      .order('first_name', { ascending: true })
    technicianMap = new Map(technicians?.map(t => [t.id, `${t.first_name} ${t.last_name}`]) ?? [])
  }

  if (technicianIds.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-16">
        <h1 className="text-2xl mb-2" style={{ color: PALETTE.primary.green, fontFamily: 'var(--font-sans)' }}>
          Revisiones
        </h1>
        <div className="mt-8 text-center py-12 rounded-lg" style={{ background: PALETTE.background.lightAlt }}>
          <p style={{ color: PALETTE.text.secondary }}>
            No hay medicamentos creados para ti todavía
          </p>
        </div>
      </div>
    )
  }

  // Get stats
  const [pendingRes, todayRes, weekRes] = await Promise.all([
    supabase
      .from('treatment_reports')
      .select('id', { count: 'exact', head: true })
      .eq('created_for_vet_id', user.id)
      .is('reviewed_by', null),
    supabase
      .from('treatment_reports')
      .select('id', { count: 'exact', head: true })
      .eq('created_for_vet_id', user.id)
      .gte('reviewed_at', today)
      .not('reviewed_by', 'is', null),
    supabase
      .from('treatment_reports')
      .select('id', { count: 'exact', head: true })
      .eq('created_for_vet_id', user.id)
      .gte('reviewed_at', weekStartIso)
      .not('reviewed_by', 'is', null),
  ])

  const stats = {
    pending: pendingRes.count ?? 0,
    today: todayRes.count ?? 0,
    week: weekRes.count ?? 0,
    technicians: technicianIds.length,
  }

  // Keep the label generic since we're now tracking unique techs who created for this vet
  const technicianCount = stats.technicians

  // Get list based on tab
  let treatments: any[] = []

  if (tab === 'pendientes') {
    const { data } = await supabase
      .from('treatment_reports')
      .select('id, tratamiento, diagnostico, fecha_tratamiento, hora_tratamiento, horse_id, horses(name), created_by')
      .eq('created_for_vet_id', user.id)
      .is('reviewed_by', null)
      .order('fecha_tratamiento', { ascending: false })
      .limit(50)
    treatments = data ?? []
  } else {
    const { data } = await supabase
      .from('treatment_reports')
      .select('id, tratamiento, diagnostico, fecha_tratamiento, hora_tratamiento, reviewed_at, horse_id, horses(name), created_by')
      .eq('created_for_vet_id', user.id)
      .not('reviewed_by', 'is', null)
      .order('reviewed_at', { ascending: false })
      .limit(50)
    treatments = data ?? []
  }

  // Get all medications for these treatments
  const treatmentIds = treatments.map(t => t.id)
  let medicationsMap = new Map<string, any[]>()
  if (treatmentIds.length > 0) {
    const { data: meds } = await supabase
      .from('treatment_report_medications')
      .select('id, treatment_report_id, drug_id, dosis, dosis_unidad, tiempo_restriccion, drug:drugs(id, nombre, withdrawal_time_dias)')
      .in('treatment_report_id', treatmentIds)

    if (meds) {
      meds.forEach(med => {
        if (!medicationsMap.has(med.treatment_report_id)) {
          medicationsMap.set(med.treatment_report_id, [])
        }
        medicationsMap.get(med.treatment_report_id)!.push(med)
      })
    }
  }


  // Add medications to treatments
  treatments = treatments.map(t => ({
    ...t,
    treatment_report_medications: medicationsMap.get(t.id) ?? []
  }))

  // Group treatments by horse for tree view
  const treatmentsByHorse = new Map<string, any[]>()
  treatments.forEach(t => {
    const horseName = t.horses?.name ?? 'Sin caballo'
    if (!treatmentsByHorse.has(horseName)) {
      treatmentsByHorse.set(horseName, [])
    }
    treatmentsByHorse.get(horseName)!.push(t)
  })

  const groupedTreatments = Array.from(treatmentsByHorse.entries()).map(([horseName, hTreatments]) => ({
    horseName,
    treatments: hTreatments,
    medicationCount: hTreatments.reduce((sum, t) => sum + (t.treatment_report_medications?.length ?? 0), 0)
  }))

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl" style={{ color: PALETTE.primary.green, fontFamily: 'var(--font-sans)' }}>
          Revisiones de Medicación
        </h1>
        <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>
          Medicamentos ingresados por tus técnicos
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 py-6 md:py-8 border-b" style={{ borderColor: PALETTE.ui.border }}>
        {[
          { label: 'Pendientes', value: stats.pending, color: '#7c3aed' },
          { label: 'Revisados Hoy', value: stats.today, color: '#0ea5e9' },
          { label: 'Revisados Semana', value: stats.week, color: '#10b981' },
          { label: 'Técnicos', value: stats.technicians, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <div className="text-3xl md:text-4xl font-bold tabular-nums mb-1" style={{ color }}>
              {value}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-8 mb-6 flex gap-4 border-b" style={{ borderColor: PALETTE.ui.border }}>
        {['pendientes', 'historial'].map((t) => (
          <Link
            key={t}
            href={`/revisiones?tab=${t}`}
            className="px-4 py-3 font-medium text-sm transition-colors border-b-2"
            style={{
              color: tab === t ? PALETTE.primary.green : PALETTE.text.secondary,
              borderColor: tab === t ? PALETTE.primary.green : 'transparent',
            }}>
            {t === 'pendientes' ? 'Pendientes' : 'Historial'}
          </Link>
        ))}
      </div>

      {/* Content */}
      {treatments.length === 0 ? (
        <div className="py-12 text-center rounded-lg" style={{ background: PALETTE.background.lightAlt }}>
          <p style={{ color: PALETTE.text.secondary }}>
            {tab === 'pendientes' ? 'No hay tratamientos pendientes de revisar' : 'Sin historial de revisiones'}
          </p>
        </div>
      ) : (
        <RevisionesTree groups={groupedTreatments} tab={tab} technicianMap={technicianMap} />
      )}
    </div>
  )
}
