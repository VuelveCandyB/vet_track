import { requirePageAccess, requireUser, isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PALETTE } from '@/lib/palette'
import ExportButton from '@/components/reports/export-button'

const RESTRICTION_STYLE: Record<string, [string, string]> = {
  'WDT':        ['#facc15', '#2e2a0d'],
  'RAT':        ['#60a5fa', '#0d1e2e'],
  'RAT+WDT':    ['#f97316', '#2e1a0d'],
  'Stand Down': ['#f87171', '#2e0d0d'],
}

export default async function MedicationsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ horse?: string; drug?: string; vet?: string; date_from?: string; date_to?: string }>
}) {
  await requirePageAccess('page.reports')
  const searchParamsObj = await searchParams
  const filters = {
    horse: searchParamsObj.horse ?? '',
    drug: searchParamsObj.drug ?? '',
    vet: searchParamsObj.vet ?? '',
    date_from: searchParamsObj.date_from ?? '',
    date_to: searchParamsObj.date_to ?? '',
  }
  const user = await requireUser()
  const admin = isAdmin(user.email!)
  const supabase = await createClient()

  let rows: any[] = []
  let noResults = false
  let horseIds: string[] = []
  let drugIds: string[] = []

  // Pre-query for horse filter
  if (filters.horse) {
    const { data: matches } = await supabase.from('horses').select('id').ilike('name', `%${filters.horse}%`)
    if (!matches?.length) { noResults = true }
    else { horseIds = matches.map((m: any) => m.id) }
  }

  // Pre-query for drug filter
  if (filters.drug) {
    const { data: matches } = await supabase.from('drugs').select('id').ilike('nombre', `%${filters.drug}%`)
    if (!matches?.length) { noResults = true }
    else { drugIds = matches.map((m: any) => m.id) }
  }

  // Main query
  if (!noResults) {
    let q = supabase.from('treatment_reports').select('*, horses(name, status), drugs(nombre, categoria, dosis_ruta, tipo_restriccion)')
    if (filters.date_from) q = q.gte('fecha_tratamiento', filters.date_from)
    if (filters.date_to)   q = q.lte('fecha_tratamiento', filters.date_to)
    if (filters.vet)       q = q.ilike('vet_autorizado_nombre', `%${filters.vet}%`)
    if (horseIds.length)   q = q.in('horse_id', horseIds)
    if (drugIds.length)    q = q.in('drug_id', drugIds)
    const { data, error } = await q.order('fecha_tratamiento', { ascending: false }).order('hora_tratamiento', { ascending: false }).limit(500)
    if (error) console.error('Treatment reports query error:', error)
    rows = data ?? []
  }

  const hasFilters = Object.values(filters).some(f => f)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: PALETTE.primary.green, fontFamily: 'var(--font-sans)' }}>
            Reporte — Medicaciones
          </h1>
          <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>Historial de medicamentos administrados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExportButton data={rows} filename="medicaciones" disabled={rows.length === 0} />
          {admin && (
            <>
              <Link href="/reports/vetlist"><Button size="sm" style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>Vetlist</Button></Link>
              <Link href="/reports/euthanasia"><Button size="sm" style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>Eutanasias</Button></Link>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <form method="get" className="rounded-xl p-5 mb-6" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Caballo</label>
            <Input key={`horse-${filters.horse}`} name="horse" defaultValue={filters.horse} placeholder="Nombre..." suppressHydrationWarning />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Medicamento</label>
            <Input key={`drug-${filters.drug}`} name="drug" defaultValue={filters.drug} placeholder="Nombre..." suppressHydrationWarning />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Veterinario</label>
            <Input key={`vet-${filters.vet}`} name="vet" defaultValue={filters.vet} placeholder="Nombre..." suppressHydrationWarning />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Desde</label>
            <Input key={`date_from-${filters.date_from}`} type="date" name="date_from" defaultValue={filters.date_from} suppressHydrationWarning />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Hasta</label>
            <Input key={`date_to-${filters.date_to}`} type="date" name="date_to" defaultValue={filters.date_to} suppressHydrationWarning />
          </div>
          <div className="flex gap-2">
            <Button type="submit" style={{ background: PALETTE.primary.green, color: '#FFFFFF' }} className="flex-1">Filtrar</Button>
          </div>
        </div>
      </form>

      {hasFilters && (
        <div className="mb-4">
          <Link href="/reports/medications"><Button size="sm" variant="ghost">Limpiar filtros</Button></Link>
        </div>
      )}

      {/* Table */}
      {noResults ? (
        <div className="rounded-xl p-12 text-center" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}`, color: PALETTE.text.secondary }}>
          No se encontraron resultados para los filtros seleccionados.
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
                  {['Caballo', 'Medicamento', 'Vía', 'Dosis', 'Restricción', 'Vet. / Fecha', 'Retiro'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: PALETTE.text.secondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => {
                  const [rfg, rbg] = r.drugs?.tipo_restriccion ? (RESTRICTION_STYLE[r.drugs.tipo_restriccion] ?? ['#9ca3af', '#1e2235']) : ['#9ca3af', '#1e2235']
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-gray-50" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                      <td className="px-4 py-3">
                        <Link href={`/horses/${r.horse_id}`} className="font-medium transition-colors" style={{ color: PALETTE.primary.green }}>
                          {r.horses?.name ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/treatment-reports/${r.id}`} className="font-medium transition-colors" style={{ color: PALETTE.primary.green }}>
                          {r.drugs?.nombre ?? '—'}
                        </Link>
                        {r.drugs?.categoria && <div className="text-xs mt-0.5" style={{ color: PALETTE.text.secondary }}>{r.drugs.categoria}</div>}
                      </td>
                      <td className="px-4 py-3" style={{ color: PALETTE.text.secondary }}>{r.drugs?.dosis_ruta || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: PALETTE.text.primary }}>{r.dosis}{r.dosis_unidad ? ` ${r.dosis_unidad}` : ''}</td>
                      <td className="px-4 py-3">
                        {r.drugs?.tipo_restriccion
                          ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ color: rfg, background: rbg }}>{r.drugs.tipo_restriccion}</span>
                          : <span style={{ color: PALETTE.text.secondary }}>—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs" style={{ color: PALETTE.text.secondary }}>{r.vet_autorizado_nombre}</div>
                        <div className="text-xs" style={{ color: PALETTE.text.secondary }}>{formatDate(r.fecha_tratamiento)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.tiempo_restriccion
                          ? <span className="text-xs font-semibold" style={{ color: PALETTE.primary.green }}>{r.tiempo_restriccion}h</span>
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
