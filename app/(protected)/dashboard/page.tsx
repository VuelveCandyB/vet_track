import { requireUser, isOfficialVet } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PALETTE } from '@/lib/palette'
import Link from 'next/link'


export default async function DashboardPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const officialVet = await isOfficialVet(user.id, user.email!)

  const [
    statsRes, recentMedsRes, vetlistRes, medsHoyRes, fallecidosRes, diagRes, redFlagCountRes, redFlagListRes
  ] = await Promise.all([
    supabase.rpc('get_horse_stats'),
    supabase.from('treatment_reports').select('id, drug:drugs(nombre), fecha_tratamiento, hora_tratamiento, vet_autorizado_nombre, horse_id, horses(name)').order('fecha_tratamiento', { ascending: false }).limit(8),
    supabase.from('vetlist').select('id, horse_id, motivo, fecha_ingreso, horses(name)').is('fecha_egreso', null).order('fecha_ingreso', { ascending: false }).limit(5),
    supabase.from('treatment_reports').select('id', { count: 'exact', head: true }).eq('fecha_tratamiento', today),
    supabase.from('horses').select('id', { count: 'exact', head: true }).eq('status', 'deceased'),
    officialVet ? supabase.from('diagnosticos').select('id, horse_id, diagnostico, vet_name, fecha, horses(name)').eq('recomendar_vetlist', true).order('fecha', { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
    supabase.from('horses').select('id', { count: 'exact', head: true }).eq('red_flag', true),
    supabase.from('horses').select('id, name, red_flag_reason, red_flag_by, red_flag_date').eq('red_flag', true).order('red_flag_date', { ascending: false }).limit(8),
  ])

  const statsRaw = statsRes.data || {}
  const recentMeds = recentMedsRes.data || []
  const vetlistActiva = vetlistRes.data || []
  const medsHoy = medsHoyRes.count || 0
  const fallecidos = fallecidosRes.count || 0
  const diagPendientes = diagRes.data || []
  const redFlagCount = redFlagCountRes.count || 0
  const redFlagList = redFlagListRes.data || []

  const stats = {
    total:    (statsRaw as Record<string, number>).total    ?? 0,
    active:   (statsRaw as Record<string, number>).active   ?? 0,
    rest:     (statsRaw as Record<string, number>).rest     ?? 0,
    injury:   (statsRaw as Record<string, number>).injury   ?? 0,
    deceased: fallecidos,
    vetlist:  vetlistActiva.length,
    meds_hoy: medsHoy,
    red_flag: redFlagCount,
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl" style={{ color: PALETTE.primary.green, fontFamily: 'var(--font-sans)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>
          Resumen operacional del hipódromo
        </p>
      </div>

      {/* Stats Strip — Grid Distribution */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-6 md:gap-8 py-6 md:py-8 border-b" style={{ borderColor: PALETTE.ui.border }}>
        {[
          { label: 'Total Caballos',   value: stats.total,      color: PALETTE.primary.green },
          { label: 'Activos',          value: stats.active,     color: '#059669' },
          { label: 'En Descanso',      value: stats.rest,       color: '#f59e0b' },
          { label: 'En Vetlist',       value: stats.vetlist,    color: '#d97706' },
          { label: 'Meds. Hoy',        value: stats.meds_hoy,   color: '#0ea5e9' },
          { label: 'Referidos',        value: stats.red_flag,   color: '#dc2626' },
          { label: 'Fallecidos',       value: stats.deceased,   color: '#6b7280' },
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

      {/* Sections Stack */}
      <div className="space-y-8 mt-8">

        {/* Referidos */}
        {redFlagList.length > 0 && (
          <div className="section">
            <span className="text-sm font-semibold uppercase tracking-wider mb-3 block" style={{ color: PALETTE.text.secondary }}>
              Caballos Referidos
            </span>
            <div className="rounded-lg border overflow-hidden" style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border }}>
              {/* Header */}
              <div className="grid gap-4 px-4 py-2.5" style={{ gridTemplateColumns: '140px 200px 1fr 120px', background: '#f8fafc', borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>Caballo</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>Motivo</div>
                <div></div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: PALETTE.text.secondary }}>Fecha</div>
              </div>
              {/* Body */}
              <>
                {redFlagList.map((r: any, idx: number) => (
                  <Link key={r.id} href={`/horses/${r.id}`}
                    className="grid gap-4 px-4 py-3 transition-colors hover:bg-slate-50"
                    style={{
                      gridTemplateColumns: '140px 200px 1fr 120px',
                      borderBottom: idx < redFlagList.length - 1 ? `1px solid ${PALETTE.ui.border}` : 'none'
                    }}>
                    <div className="text-sm font-medium truncate" style={{ color: PALETTE.text.primary }}>
                      {r.name ?? '—'}
                    </div>
                    <div className="text-sm truncate" style={{ color: PALETTE.text.secondary }}>
                      {r.red_flag_reason ?? '—'}
                    </div>
                    <div></div>
                    <div className="text-sm text-right" style={{ color: PALETTE.text.primary }}>
                      {r.red_flag_date?.slice(0, 10) ?? '—'}
                    </div>
                  </Link>
                ))}
              </>
            </div>
          </div>
        )}

        {/* Vetlist activa */}
        <div className="section">
          <span className="text-sm font-semibold uppercase tracking-wider mb-3 block" style={{ color: PALETTE.text.secondary }}>
            En Vetlist
          </span>
          <div className="rounded-lg border overflow-hidden" style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border }}>
            {/* Header */}
            <div className="grid gap-4 px-4 py-2.5" style={{ gridTemplateColumns: '140px 200px 1fr 120px', background: '#f8fafc', borderBottom: `1px solid ${PALETTE.ui.border}` }}>
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>Caballo</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>Motivo</div>
              <div></div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: PALETTE.text.secondary }}>Ingreso</div>
            </div>
            {/* Body */}
            {vetlistActiva.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: PALETTE.text.secondary }}>
                No existen datos
              </div>
            ) : (
              <>
                {vetlistActiva.map((v: any, idx: number) => (
                  <Link key={v.id} href={`/horses/${v.horse_id}`}
                    className="grid gap-4 px-4 py-3 transition-colors hover:bg-slate-50"
                    style={{
                      gridTemplateColumns: '140px 200px 1fr 120px',
                      borderBottom: idx < vetlistActiva.length - 1 ? `1px solid ${PALETTE.ui.border}` : 'none'
                    }}>
                    <div className="text-sm font-medium truncate" style={{ color: PALETTE.text.primary }}>
                      {v.horses?.name ?? '—'}
                    </div>
                    <div className="text-sm truncate" style={{ color: PALETTE.text.secondary }}>
                      {v.motivo ?? '—'}
                    </div>
                    <div></div>
                    <div className="text-sm text-right" style={{ color: PALETTE.text.primary }}>
                      {v.fecha_ingreso ?? '—'}
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Recomendaciones pendientes (solo para official_vet) */}
        {officialVet && (
          <div className="section">
            <span className="text-sm font-semibold uppercase tracking-wider mb-3 block" style={{ color: PALETTE.text.secondary }}>
              Recomendaciones Pendientes
            </span>
            <div className="rounded-lg border overflow-hidden" style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border }}>
              {/* Header */}
              <div className="grid gap-4 px-4 py-2.5" style={{ gridTemplateColumns: '140px 200px 1fr 120px', background: '#f8fafc', borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>Caballo</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>Diagnóstico</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>Vet</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: PALETTE.text.secondary }}>Fecha</div>
              </div>
              {/* Body */}
              {diagPendientes.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: PALETTE.text.secondary }}>
                  No existen datos
                </div>
              ) : (
                <>
                  {diagPendientes.map((d: any, idx: number) => (
                    <Link key={d.id} href={`/horses/${d.horse_id}`}
                      className="grid gap-4 px-4 py-3 transition-colors hover:bg-slate-50"
                      style={{
                        gridTemplateColumns: '140px 200px 1fr 120px',
                        borderBottom: idx < diagPendientes.length - 1 ? `1px solid ${PALETTE.ui.border}` : 'none'
                      }}>
                      <div className="text-sm font-medium truncate" style={{ color: PALETTE.text.primary }}>
                        {d.horses?.name ?? '—'}
                      </div>
                      <div className="text-sm truncate" style={{ color: PALETTE.text.secondary }}>
                        {d.diagnostico ?? '—'}
                      </div>
                      <div className="text-sm truncate" style={{ color: PALETTE.text.secondary }}>
                        {d.vet_name ?? '—'}
                      </div>
                      <div className="text-sm text-right" style={{ color: PALETTE.text.primary }}>
                        {d.fecha ?? '—'}
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Medicaciones recientes */}
        <div className="section">
          <span className="text-sm font-semibold uppercase tracking-wider mb-3 block" style={{ color: PALETTE.text.secondary }}>
            Medicaciones Recientes
          </span>
          <div className="rounded-lg border overflow-hidden" style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border }}>
            {/* Header */}
            <div className="grid gap-4 px-4 py-2.5" style={{ gridTemplateColumns: '140px 200px 1fr 160px', background: '#f8fafc', borderBottom: `1px solid ${PALETTE.ui.border}` }}>
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>Caballo</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>Medicamento</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>Vet</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: PALETTE.text.secondary }}>Fecha/Hora</div>
            </div>
            {/* Body */}
            {recentMeds.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: PALETTE.text.secondary }}>
                Sin medicaciones registradas.
              </div>
            ) : (
              <>
                {recentMeds.map((m: any, idx: number) => (
                  <Link key={m.id} href={`/horses/${m.horse_id}`}
                    className="grid gap-4 px-4 py-3 transition-colors hover:bg-slate-50"
                    style={{
                      gridTemplateColumns: '140px 200px 1fr 160px',
                      borderBottom: idx < recentMeds.length - 1 ? `1px solid ${PALETTE.ui.border}` : 'none',
                      alignItems: 'center'
                    }}>
                    <div className="text-sm font-medium truncate" style={{ color: PALETTE.text.primary }}>
                      {(m.horses as any)?.name ?? '—'}
                    </div>
                    <div className="text-sm truncate" style={{ color: PALETTE.text.secondary }}>
                      {m.drug?.nombre ?? '—'}
                    </div>
                    <div className="text-sm truncate" style={{ color: PALETTE.text.secondary }}>
                      {m.vet_autorizado_nombre ?? '—'}
                    </div>
                    <div className="text-sm text-right" style={{ color: PALETTE.text.primary }}>
                      {m.fecha_tratamiento} {m.hora_tratamiento}
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
