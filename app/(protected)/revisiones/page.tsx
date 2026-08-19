import { createClient } from '@/lib/supabase/server'
import { requireUser, can } from '@/lib/auth'
import { PALETTE } from '@/lib/palette'
import Link from 'next/link'
import ReviewMedicationButton from '@/components/revisiones/review-medication-button'

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
      .select('id, tratamiento, diagnostico, fecha_tratamiento, hora_tratamiento, dosis, dosis_unidad, tiempo_restriccion, horse_id, horses(name), drug_id, created_by')
      .eq('created_for_vet_id', user.id)
      .is('reviewed_by', null)
      .order('fecha_tratamiento', { ascending: false })
      .limit(50)
    treatments = data ?? []
  } else {
    const { data } = await supabase
      .from('treatment_reports')
      .select('id, tratamiento, diagnostico, fecha_tratamiento, hora_tratamiento, reviewed_at, dosis, dosis_unidad, tiempo_restriccion, horse_id, horses(name), drug_id, created_by')
      .eq('created_for_vet_id', user.id)
      .not('reviewed_by', 'is', null)
      .order('reviewed_at', { ascending: false })
      .limit(50)
    treatments = data ?? []
  }

  // Lookup de nombres y días de drugs
  const drugIds = treatments.map(t => t.drug_id).filter(Boolean)
  let drugData: any[] = []
  if (drugIds.length > 0) {
    const { data } = await supabase.from('drugs').select('id, nombre, withdrawal_time_dias').in('id', drugIds)
    drugData = data ?? []
  }
  const drugNames = new Map(drugData.map(d => [d.id, d.nombre]))
  const drugDias = new Map(drugData.map(d => [d.id, d.withdrawal_time_dias]))

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
        <div className="rounded-lg border overflow-hidden" style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border }}>
          {/* Header */}
          <div
            className="grid gap-4 px-4 py-2.5"
            style={{
              gridTemplateColumns: tab === 'pendientes' ? '200px 140px 100px 90px 130px 100px 120px auto' : '200px 140px 100px 90px 130px 100px 120px',
              background: '#f8fafc',
              borderBottom: `1px solid ${PALETTE.ui.border}`,
            }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              Caballo
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              Medicamento
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              Dosis
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              Restricción
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              Técnico
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: PALETTE.text.secondary }}>
              {tab === 'pendientes' ? 'Ingresado' : 'Revisado'}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              Diagnóstico
            </div>
            {tab === 'pendientes' && <div className="text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: PALETTE.text.secondary }}>Acción</div>}
          </div>

          {/* Body */}
          {treatments.map((t, idx) => (
            <div
              key={t.id}
              className="grid gap-4 px-4 py-3 transition-colors hover:bg-slate-50"
              style={{
                gridTemplateColumns: tab === 'pendientes' ? '200px 140px 100px 90px 130px 100px 120px auto' : '200px 140px 100px 90px 130px 100px 120px',
                borderBottom: idx < treatments.length - 1 ? `1px solid ${PALETTE.ui.border}` : 'none',
                alignItems: 'center',
              }}>
              <div className="text-sm font-medium" style={{ color: PALETTE.text.primary }}>
                {t.horses?.name ?? '—'}
              </div>
              <div className="text-sm truncate" style={{ color: PALETTE.text.secondary }}>
                {drugNames.get(t.drug_id) ?? '—'}
              </div>
              <div className="text-sm truncate" style={{ color: PALETTE.text.secondary }}>
                {t.dosis ? `${t.dosis} ${t.dosis_unidad || 'mg'}` : '—'}
              </div>
              <div className="text-sm" style={{ color: PALETTE.text.secondary }}>
                {t.tiempo_restriccion ? (
                  <div>
                    <div>{t.tiempo_restriccion}h</div>
                    <div className="text-xs">{drugDias.get(t.drug_id) || '—'}d</div>
                  </div>
                ) : '—'}
              </div>
              <div className="text-sm truncate" style={{ color: PALETTE.text.secondary }}>
                {technicianMap.get(t.created_by) ?? '—'}
              </div>
              <div className="text-sm text-right" style={{ color: PALETTE.text.primary }}>
                {tab === 'pendientes'
                  ? (t.fecha_tratamiento && t.hora_tratamiento ? `${t.fecha_tratamiento.slice(5, 10)} ${formatTo12Hour(t.hora_tratamiento)}` : '—')
                  : (t.reviewed_at ? new Date(t.reviewed_at).toLocaleString('es-ES', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }) : '—')
                }
              </div>
              <div className="text-sm truncate text-xs" style={{ color: PALETTE.text.secondary }}>
                {(t.tratamiento || t.diagnostico) ?? '—'}
              </div>
              {tab === 'pendientes' && (
                <div className="text-right">
                  <ReviewMedicationButton medId={t.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
