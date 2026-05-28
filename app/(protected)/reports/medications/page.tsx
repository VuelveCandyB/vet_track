import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const RESTRICTION_STYLE: Record<string, [string, string]> = {
  'WDT':        ['#facc15', '#2e2a0d'],
  'RAT':        ['#60a5fa', '#0d1e2e'],
  'RAT+WDT':    ['#f97316', '#2e1a0d'],
  'Stand Down': ['#f87171', '#2e0d0d'],
}

export default async function MedicationsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ horse?: string; drug?: string; vet?: string; date_from?: string; date_to?: string; categoria?: string }>
}) {
  await requireUser()
  const filters = await searchParams
  const supabase = await createClient()

  let rows: any[] = []
  let noResults = false

  if (filters.horse) {
    const { data: matches } = await supabase.from('horses').select('id').ilike('name', `%${filters.horse}%`)
    if (!matches?.length) { noResults = true }
    else {
      let q = supabase.from('medications').select('*, horses(name, status)')
      if (filters.date_from) q = q.gte('administered_at', filters.date_from)
      if (filters.date_to)   q = q.lte('administered_at', filters.date_to)
      if (filters.vet)       q = q.ilike('vet_name', `%${filters.vet}%`)
      if (filters.drug)      q = q.ilike('drug', `%${filters.drug}%`)
      if (filters.categoria) q = q.eq('drug_categoria', filters.categoria)
      q = q.in('horse_id', matches.map((m: any) => m.id))
      const { data } = await q.order('administered_at', { ascending: false }).limit(500)
      rows = data ?? []
    }
  } else {
    let q = supabase.from('medications').select('*, horses(name, status)')
    if (filters.date_from) q = q.gte('administered_at', filters.date_from)
    if (filters.date_to)   q = q.lte('administered_at', filters.date_to)
    if (filters.vet)       q = q.ilike('vet_name', `%${filters.vet}%`)
    if (filters.drug)      q = q.ilike('drug', `%${filters.drug}%`)
    if (filters.categoria) q = q.eq('drug_categoria', filters.categoria)
    const { data } = await q.order('administered_at', { ascending: false }).limit(500)
    rows = data ?? []
  }

  const categorias = [...new Set(rows.map((r: any) => r.drug_categoria).filter(Boolean))].sort()

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: '"Dela Gothic One", sans-serif' }}>
            Reporte — Medicaciones
          </h1>
          <p className="text-sm mt-1" style={{ color: '#4a5280' }}>Historial de medicamentos administrados</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports/vetlist"><Button variant="ghost" size="sm">Vetlist</Button></Link>
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
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5280' }}>Medicamento</label>
            <Input name="drug" defaultValue={filters.drug} placeholder="Nombre..." />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5280' }}>Veterinario</label>
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
          <div className="flex gap-2">
            <Button type="submit" style={{ background: '#2B55F4' }} className="flex-1">Filtrar</Button>
            <Link href="/reports/medications"><Button variant="ghost" type="button">✕</Button></Link>
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
                  {['Caballo', 'Medicamento', 'Tipo', 'Dosis', 'Restricción', 'Vet. / Fecha', 'Retiro'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: '#4a5280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => {
                  const [rfg, rbg] = r.tipo_restriccion ? (RESTRICTION_STYLE[r.tipo_restriccion] ?? ['#9ca3af', '#1e2235']) : ['#9ca3af', '#1e2235']
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid #1e2235' }}>
                      <td className="px-4 py-3">
                        <Link href={`/horses/${r.horse_id}`} className="font-medium text-white hover:text-blue-400 transition-colors">
                          {r.horses?.name ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{r.drug}</div>
                        {r.drug_categoria && <div className="text-xs mt-0.5" style={{ color: '#6b7399' }}>{r.drug_categoria}</div>}
                      </td>
                      <td className="px-4 py-3" style={{ color: '#9ca3af' }}>{r.type}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#c0c8e0' }}>{r.dose}</td>
                      <td className="px-4 py-3">
                        {r.tipo_restriccion
                          ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ color: rfg, background: rbg }}>{r.tipo_restriccion}</span>
                          : <span style={{ color: '#4a5280' }}>—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs" style={{ color: '#9ca3af' }}>{r.vet_name}</div>
                        <div className="text-xs" style={{ color: '#6b7399' }}>{r.administered_at}</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.withdrawal_time_horas
                          ? <span className="text-xs font-semibold" style={{ color: '#f97316' }}>{r.withdrawal_time_horas}h</span>
                          : <span style={{ color: '#4a5280' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
