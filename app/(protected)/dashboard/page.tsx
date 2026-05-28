import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', rest: 'Descanso', injury: 'Lesionado', deceased: 'Fallecido',
}
const STATUS_COLOR: Record<string, string> = {
  active:   'bg-green-950 text-green-400 border-green-900',
  rest:     'bg-yellow-950 text-yellow-400 border-yellow-900',
  injury:   'bg-red-950 text-red-400 border-red-900',
  deceased: 'bg-zinc-900 text-zinc-500 border-zinc-800',
}

export default async function DashboardPage() {
  await requireUser()
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    statsRes, attentionRes, recentMedsRes, vetlistRes, medsHoyRes, fallecidosRes
  ] = await Promise.all([
    supabase.rpc('get_horse_stats'),
    supabase.from('horses').select('id, name, status').in('status', ['rest', 'injury']).limit(50),
    supabase.from('medications').select('id, drug, type, administered_at, vet_name, horse_id, horses(name)').order('administered_at', { ascending: false }).limit(8),
    supabase.from('vetlist').select('id, horse_id, motivo, fecha_ingreso, horses(name)').is('fecha_egreso', null).order('fecha_ingreso', { ascending: false }).limit(5),
    supabase.from('medications').select('id', { count: 'exact', head: true }).eq('administered_at', today),
    supabase.from('horses').select('id', { count: 'exact', head: true }).eq('status', 'deceased'),
  ])

  const statsRaw = statsRes.data || {}
  const attention = attentionRes.data || []
  const recentMeds = recentMedsRes.data || []
  const vetlistActiva = vetlistRes.data || []
  const medsHoy = medsHoyRes.count || 0
  const fallecidos = fallecidosRes.count || 0

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
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-dela)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: '#4a5280' }}>
          Resumen operacional del hipódromo
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Caballos',   value: stats.total,    color: '#818cf8' },
          { label: 'Activos',          value: stats.active,   color: '#4ade80' },
          { label: 'En Descanso',      value: stats.rest,     color: '#facc15' },
          { label: 'Lesionados',       value: stats.injury,   color: '#f87171' },
          { label: 'En Vetlist',       value: stats.vetlist,  color: '#f97316' },
          { label: 'Meds. Hoy',        value: stats.meds_hoy, color: '#38bdf8' },
          { label: 'Fallecidos',       value: stats.deceased, color: '#6b7280' },
        ].map(({ label, value, color }) => (
          <Card key={label} style={{ background: '#131829', border: '1px solid #252d4a' }}>
            <CardContent className="pt-5 pb-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a5280' }}>
                {label}
              </div>
              <div className="text-3xl font-bold tabular-nums" style={{ color }}>
                {value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Vetlist activa */}
        <Card style={{ background: '#131829', border: '1px solid #252d4a' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#4a5280' }}>
              En Vetlist
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vetlistActiva.length === 0 ? (
              <p className="text-sm" style={{ color: '#4a5280' }}>Sin caballos en vetlist.</p>
            ) : (
              <div className="space-y-2">
                {vetlistActiva.map((v: any) => (
                  <Link key={v.id} href={`/horses/${v.horse_id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg transition-colors hover:bg-white/5">
                    <div>
                      <div className="text-sm font-medium text-white">{v.horses?.name ?? '—'}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#6b7399' }}>
                        {v.motivo} · {v.fecha_ingreso}
                      </div>
                    </div>
                    <Badge className="bg-red-950 text-red-400 border-red-900 text-xs">Vetlist</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atención */}
        <Card style={{ background: '#131829', border: '1px solid #252d4a' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#4a5280' }}>
              Requieren Atención
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attention.length === 0 ? (
              <p className="text-sm" style={{ color: '#4a5280' }}>Ningún caballo requiere atención.</p>
            ) : (
              <div className="space-y-2">
                {attention.map((h: any) => (
                  <Link key={h.id} href={`/horses/${h.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg transition-colors hover:bg-white/5">
                    <span className="text-sm font-medium text-white">{h.name}</span>
                    <Badge className={`text-xs border ${STATUS_COLOR[h.status] ?? ''}`}>
                      {STATUS_LABEL[h.status] ?? h.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medicaciones recientes */}
        <Card className="md:col-span-2" style={{ background: '#131829', border: '1px solid #252d4a' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#4a5280' }}>
              Medicaciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMeds.length === 0 ? (
              <p className="text-sm" style={{ color: '#4a5280' }}>Sin medicaciones registradas.</p>
            ) : (
              <div className="space-y-2">
                {recentMeds.map((m: any) => (
                  <Link key={m.id} href={`/horses/${m.horse_id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg transition-colors hover:bg-white/5">
                    <div>
                      <span className="text-sm font-medium text-white">{(m.horses as any)?.name ?? '—'}</span>
                      <span className="text-sm ml-2" style={{ color: '#9ca3af' }}>— {m.drug}</span>
                    </div>
                    <div className="text-xs text-right" style={{ color: '#6b7399' }}>
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
