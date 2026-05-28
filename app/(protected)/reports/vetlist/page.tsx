import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function VetlistReportPage({
  searchParams,
}: {
  searchParams: Promise<{ horse?: string; vet?: string; date_from?: string; date_to?: string; estado?: string }>
}) {
  await requireUser()
  const filters = await searchParams
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  let rows: any[] = []
  let noResults = false

  const buildQuery = async (horseIds?: string[]) => {
    let q = supabase.from('vetlist').select('*, horses(name)')
    if (filters.date_from)      q = q.gte('fecha_ingreso', filters.date_from)
    if (filters.date_to)        q = q.lte('fecha_ingreso', filters.date_to)
    if (filters.vet)            q = q.ilike('vet_ingreso', `%${filters.vet}%`)
    if (filters.estado === 'activos') q = q.is('fecha_egreso', null)
    if (horseIds)               q = q.in('horse_id', horseIds)
    const { data } = await q.order('fecha_ingreso', { ascending: false }).limit(500)
    return data ?? []
  }

  if (filters.horse) {
    const { data: matches } = await supabase.from('horses').select('id').ilike('name', `%${filters.horse}%`)
    if (!matches?.length) noResults = true
    else rows = await buildQuery(matches.map((m: any) => m.id))
  } else {
    rows = await buildQuery()
  }

  // Enrich with computed fields
  rows = rows.map((r: any) => {
    const ini = new Date(r.fecha_ingreso)
    const fin = r.fecha_egreso ? new Date(r.fecha_egreso) : new Date(today)
    const duracionDias = Math.floor((fin.getTime() - ini.getTime()) / 86400000)

    let diasRestantes: number | null = null
    if (r.fecha_fin_descanso && !r.fecha_egreso) {
      diasRestantes = Math.floor((new Date(r.fecha_fin_descanso).getTime() - new Date(today).getTime()) / 86400000)
    }

    return { ...r, duracion_dias: duracionDias, dias_restantes: diasRestantes }
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-dela)' }}>
            Reporte — Vetlist
          </h1>
          <p className="text-sm mt-1" style={{ color: '#4a5280' }}>Ingresos y egresos de caballos bajo tratamiento</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports/medications"><Button variant="ghost" size="sm">Medicaciones</Button></Link>
          <Link href="/reports/euthanasia"><Button variant="ghost" size="sm">Eutanasias</Button></Link>
        </div>
      </div>

      {/* Filters */}
      <form method="get" className="rounded-xl p-5 mb-6" style={{ background: '#131829', border: '1px solid #252d4a' }}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5280' }}>Caballo</label>
            <Input name="horse" defaultValue={filters.horse} placeholder="Nombre..." />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5280' }}>Vet. ingreso</label>
            <Input name="vet" defaultValue={filters.vet} placeholder="Nombre..." />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5280' }}>Desde</label>
            <Input type="date" name="date_from" defaultValue={filters.date_from} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5280' }}>Hasta</label>
            <Input type="date" name="date_to" defaultValue={filters.date_to} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5280' }}>Estado</label>
            <select name="estado" defaultValue={filters.estado ?? ''} className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
              style={{ background: '#0d102080', borderColor: '#252d4a', color: '#e2e8f0' }}>
              <option value="">Todos</option>
              <option value="activos">Solo activos</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" style={{ background: '#2B55F4' }} className="flex-1">Filtrar</Button>
            <Link href="/reports/vetlist"><Button variant="ghost" type="button">✕</Button></Link>
          </div>
        </div>
      </form>

      {/* Table */}
      {noResults ? (
        <div className="rounded-xl p-12 text-center" style={{ background: '#131829', border: '1px solid #252d4a', color: '#4a5280' }}>
          No se encontraron caballos con ese nombre.
        </div>
      ) : !rows.length ? (
        <div className="rounded-xl p-12 text-center" style={{ background: '#131829', border: '1px solid #252d4a', color: '#4a5280' }}>
          Sin registros para los filtros seleccionados.
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: '#131829', border: '1px solid #252d4a' }}>
          <div className="px-5 py-3 border-b text-xs" style={{ borderColor: '#252d4a', color: '#4a5280' }}>
            {rows.length} registro{rows.length !== 1 ? 's' : ''}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid #252d4a' }}>
                  {['Caballo', 'Ingreso', 'Egreso', 'Inicio descanso', 'Fin descanso', 'Duración', 'Días p/correr', 'Motivo', 'Veterinario', 'Estado'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: '#4a5280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid #1e2235' }}>
                    <td className="px-4 py-3">
                      <Link href={`/horses/${r.horse_id}`} className="font-medium text-white hover:text-blue-400 transition-colors">
                        {r.horses?.name ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#9ca3af' }}>{r.fecha_ingreso || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#9ca3af' }}>{r.fecha_egreso || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#9ca3af' }}>{r.fecha_inicio_descanso || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#9ca3af' }}>{r.fecha_fin_descanso || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: '#0d2e4a', color: '#7dd3fc' }}>
                        {r.duracion_dias}d
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.dias_restantes !== null ? (
                        r.dias_restantes > 0
                          ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#2e1a0d', color: '#fb923c' }}>{r.dias_restantes}d</span>
                          : r.dias_restantes === 0
                            ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#2e2a0d', color: '#facc15' }}>Hoy</span>
                            : <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#0d2e1a', color: '#4ade80' }}>Listo</span>
                      ) : <span style={{ color: '#4a5280' }}>—</span>}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#9ca3af', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.motivo || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#9ca3af' }}>{r.vet_ingreso || '—'}</td>
                    <td className="px-4 py-3">
                      {!r.fecha_egreso
                        ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#14532d40', color: '#86efac' }}>Activo</span>
                        : <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#1f293780', color: '#94a3b8' }}>Egresado</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
