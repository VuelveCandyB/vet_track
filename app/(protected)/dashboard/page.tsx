import { requireUser, isAdmin, isOfficialVet } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PALETTE } from '@/lib/palette'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', rest: 'Descanso', injury: 'Lesionado', deceased: 'Fallecido',
}
const STATUS_COLOR: Record<string, string> = {
  active:   'border-l-4 border-green-600 bg-green-50',
  rest:     'border-l-4 border-yellow-600 bg-yellow-50',
  injury:   'border-l-4 border-red-600 bg-red-50',
  deceased: 'border-l-4 border-gray-400 bg-gray-50',
}

export default async function DashboardPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const officialVet = await isOfficialVet(user.id, user.email!)

  const [
    statsRes, recentMedsRes, vetlistRes, medsHoyRes, fallecidosRes, diagRes
  ] = await Promise.all([
    supabase.rpc('get_horse_stats'),
    supabase.from('medications').select('id, drug, type, administered_at, vet_name, horse_id, horses(name)').order('administered_at', { ascending: false }).limit(8),
    supabase.from('vetlist').select('id, horse_id, motivo, fecha_ingreso, horses(name)').is('fecha_egreso', null).order('fecha_ingreso', { ascending: false }).limit(5),
    supabase.from('medications').select('id', { count: 'exact', head: true }).eq('administered_at', today),
    supabase.from('horses').select('id', { count: 'exact', head: true }).eq('status', 'deceased'),
    officialVet ? supabase.from('diagnosticos').select('id, horse_id, diagnostico, vet_name, fecha, horses(name)').eq('recomendar_vetlist', true).order('fecha', { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
  ])

  const statsRaw = statsRes.data || {}
  const recentMeds = recentMedsRes.data || []
  const vetlistActiva = vetlistRes.data || []
  const medsHoy = medsHoyRes.count || 0
  const fallecidos = fallecidosRes.count || 0
  const diagPendientes = diagRes.data || []

  const stats = {
    total:    (statsRaw as Record<string, number>).total    ?? 0,
    active:   (statsRaw as Record<string, number>).active   ?? 0,
    rest:     (statsRaw as Record<string, number>).rest     ?? 0,
    injury:   (statsRaw as Record<string, number>).injury   ?? 0,
    deceased: fallecidos,
    vetlist:  vetlistActiva.length,
    meds_hoy: medsHoy,
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl" style={{ color: PALETTE.text.primary, fontFamily: 'var(--font-sans)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>
          Resumen operacional del hipódromo
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
        {[
          { label: 'Total Caballos',   value: stats.total,    color: PALETTE.primary.green },
          { label: 'Activos',          value: stats.active,   color: '#059669' },
          { label: 'En Descanso',      value: stats.rest,     color: '#f59e0b' },
          { label: 'En Vetlist',       value: stats.vetlist,  color: '#d97706' },
          { label: 'Meds. Hoy',        value: stats.meds_hoy, color: '#0ea5e9' },
          { label: 'Fallecidos',       value: stats.deceased, color: '#6b7280' },
        ].map(({ label, value, color }) => (
          <Card key={label} style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
            <CardContent className="pt-5 pb-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: PALETTE.text.secondary }}>
                {label}
              </div>
              <div className="text-3xl font-bold tabular-nums" style={{ color }}>
                {value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* Vetlist activa */}
        <Card style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
          <CardHeader className="pb-3 px-0 -mx-2 px-2">
            <CardTitle className="w-full text-sm font-semibold uppercase tracking-wider text-white px-4 py-2 rounded-md" style={{ background: PALETTE.primary.green }}>
              En Vetlist
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vetlistActiva.length === 0 ? (
              <p className="text-sm" style={{ color: PALETTE.text.secondary }}>Sin caballos en vetlist.</p>
            ) : (
              <div className="space-y-0 divide-y" style={{ borderColor: '#f0f5f9' }}>
                {vetlistActiva.map((v: any) => (
                  <Link key={v.id} href={`/horses/${v.horse_id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg transition-colors hover:bg-[#05966920]">
                    <div>
                      <div className="text-sm font-medium" style={{ color: PALETTE.text.primary }}>{v.horses?.name ?? '—'}</div>
                      <div className="text-xs mt-0.5" style={{ color: PALETTE.text.secondary }}>
                        {v.motivo} · {v.fecha_ingreso}
                      </div>
                    </div>
                    <Badge style={{ background: '#fee2e2', border: '1px solid #dc2626', color: '#991B1B' }} className="text-xs">Vetlist</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

{/* Recomendaciones pendientes (solo para official_vet o admin) */}
        {officialVet && (
          <Card style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
            <CardHeader className="pb-3 px-0">
              <CardTitle className="w-screen text-sm font-semibold uppercase tracking-wider text-white px-4 py-2 rounded-md" style={{ background: PALETTE.primary.green, marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
                Recomendaciones Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {diagPendientes.length === 0 ? (
                <p className="text-sm" style={{ color: PALETTE.text.secondary }}>Sin recomendaciones pendientes.</p>
              ) : (
                <div className="space-y-0 divide-y" style={{ borderColor: '#f0f5f9' }}>
                  {diagPendientes.map((d: any) => (
                    <Link key={d.id} href={`/horses/${d.horse_id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg transition-colors hover:bg-[#05966920]">
                      <div>
                        <div className="text-sm font-medium" style={{ color: PALETTE.text.primary }}>{d.horses?.name ?? '—'}</div>
                        <div className="text-xs mt-0.5" style={{ color: PALETTE.text.secondary }}>
                          {d.diagnostico} · {d.vet_name}
                        </div>
                      </div>
                      <Badge style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e' }} className="text-xs">
                        VetList Recomendado
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Medicaciones recientes */}
        <Card className="md:col-span-3" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
          <CardHeader className="pb-3 px-0 -mx-2 px-2">
            <CardTitle className="w-full text-sm font-semibold uppercase tracking-wider text-white px-4 py-2 rounded-md" style={{ background: PALETTE.primary.green }}>
              Medicaciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMeds.length === 0 ? (
              <p className="text-sm" style={{ color: PALETTE.text.secondary }}>Sin medicaciones registradas.</p>
            ) : (
              <div className="space-y-0 divide-y" style={{ borderColor: '#f0f5f9' }}>
                {recentMeds.map((m: any) => (
                  <Link key={m.id} href={`/horses/${m.horse_id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg transition-colors hover:bg-[#05966920]">
                    <div>
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://res.cloudinary.com/dee0x7p16/image/upload/v1780762906/HC_Icono-Cabeza_Azul-Oscuro_jvimak.png" alt="caballo" className="h-5 w-5" />
                        <span className="text-sm font-medium" style={{ color: PALETTE.text.primary }}>{(m.horses as any)?.name ?? '—'}</span>
                      </div>
                      <span className="text-sm ml-2" style={{ color: PALETTE.text.secondary }}>— {m.drug}</span>
                    </div>
                    <div className="text-xs text-right" style={{ color: PALETTE.text.secondary }}>
                      <div>{m.type}</div>
                      <div>{m.administered_at}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
