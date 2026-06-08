import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PALETTE } from '@/lib/palette'

const RESTRICTION_STYLE: Record<string, [string, string]> = {
  'WDT':        ['#facc15', '#2e2a0d'],
  'RAT':        ['#60a5fa', '#0d1e2e'],
  'RAT+WDT':    ['#f97316', '#2e1a0d'],
  'Stand Down': ['#f87171', '#2e0d0d'],
}

export default async function MedicationsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ horse?: string; drug?: string; vet?: string; date_from?: string; date_to?: string; categoria?: string; proposito?: string }>
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
      if (filters.proposito) q = q.eq('proposito', filters.proposito)
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
    if (filters.proposito) q = q.eq('proposito', filters.proposito)
    const { data } = await q.order('administered_at', { ascending: false }).limit(500)
    rows = data ?? []
  }

  const categorias = [...new Set(rows.map((r: any) => r.drug_categoria).filter(Boolean))].sort()
  const propositos = [...new Set(rows.map((r: any) => r.proposito).filter(Boolean))].sort()

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: PALETTE.primary.green, fontFamily: 'var(--font-sans)' }}>
            Reporte — Medicaciones
          </h1>
          <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>Historial de medicamentos administrados</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports/vetlist"><Button size="sm" style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>Vetlist</Button></Link>
          <Link href="/reports/euthanasia"><Button size="sm" style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>Eutanasias</Button></Link>
        </div>
      </div>

      {/* Filters */}
      <form method="get" className="rounded-xl p-5 mb-6" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Caballo</label>
            <Input name="horse" defaultValue={filters.horse} placeholder="Nombre..." />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Medicamento</label>
            <Input name="drug" defaultValue={filters.drug} placeholder="Nombre..." />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Veterinario</label>
            <Input name="vet" defaultValue={filters.vet} placeholder="Nombre..." />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Propósito</label>
            <select name="proposito" className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
              style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border, color: PALETTE.text.primary }}>
              <option value="">Todos</option>
              {propositos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Desde</label>
            <Input type="date" name="date_from" defaultValue={filters.date_from} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Hasta</label>
            <Input type="date" name="date_to" defaultValue={filters.date_to} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" style={{ background: PALETTE.primary.green, color: '#FFFFFF' }} className="flex-1">Filtrar</Button>
            <Link href="/reports/medications"><Button variant="ghost" type="button">✕</Button></Link>
          </div>
        </div>
      </form>

      {/* Table */}
      {noResults ? (
        <div className="rounded-xl p-12 text-center" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}`, color: PALETTE.text.secondary }}>
          No se encontraron caballos con ese nombre.
        </div>
      ) : !rows.length ? (
        <div className="rounded-xl p-12 text-center" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}`, color: PALETTE.text.secondary }}>
          Sin registros para los filtros seleccionados.
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
          <div className="px-5 py-3 border-b text-xs" style={{ borderColor: PALETTE.ui.border, color: PALETTE.text.secondary }}>
            {rows.length} registro{rows.length !== 1 ? 's' : ''}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid #252d4a' }}>
                  {['Caballo', 'Medicamento', 'Vía', 'Propósito', 'Dosis', 'Restricción', 'Vet. / Fecha', 'Retiro'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: PALETTE.text.secondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => {
                  const [rfg, rbg] = r.tipo_restriccion ? (RESTRICTION_STYLE[r.tipo_restriccion] ?? ['#9ca3af', '#1e2235']) : ['#9ca3af', '#1e2235']
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-gray-50" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                      <td className="px-4 py-3">
                        <Link href={`/horses/${r.horse_id}`} className="font-medium transition-colors" style={{ color: PALETTE.primary.green }}>
                          {r.horses?.name ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium" style={{ color: PALETTE.primary.green }}>{r.drug}</div>
                        {r.drug_categoria && <div className="text-xs mt-0.5" style={{ color: PALETTE.text.secondary }}>{r.drug_categoria}</div>}
                      </td>
                      <td className="px-4 py-3" style={{ color: PALETTE.text.secondary }}>{r.type || '—'}</td>
                      <td className="px-4 py-3" style={{ color: PALETTE.text.secondary }}>{r.proposito || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: PALETTE.text.primary }}>{r.dose}</td>
                      <td className="px-4 py-3">
                        {r.tipo_restriccion
                          ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ color: rfg, background: rbg }}>{r.tipo_restriccion}</span>
                          : <span style={{ color: PALETTE.text.secondary }}>—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs" style={{ color: PALETTE.text.secondary }}>{r.vet_name}</div>
                        <div className="text-xs" style={{ color: PALETTE.text.secondary }}>{r.administered_at}</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.withdrawal_time_horas
                          ? <span className="text-xs font-semibold" style={{ color: PALETTE.primary.green }}>{r.withdrawal_time_horas}h</span>
                          : <span style={{ color: PALETTE.text.secondary }}>—</span>}
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
