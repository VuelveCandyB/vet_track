import { requirePageAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PALETTE } from '@/lib/palette'

export default async function EuthanasiaReportPage({
  searchParams,
}: {
  searchParams: Promise<{ horse?: string; vet?: string; date_from?: string; date_to?: string; notificado?: string }>
}) {
  await requirePageAccess('page.reports')
  const filters = await searchParams
  const supabase = await createClient()

  let rows: any[] = []
  let noResults = false

  if (filters.horse) {
    const { data: matches } = await supabase.from('horses').select('id').ilike('name', `%${filters.horse}%`)
    if (!matches?.length) { noResults = true }
    else {
      let q = supabase.from('euthanasia').select('*, horses(name)')
      if (filters.date_from)         q = q.gte('fecha', filters.date_from)
      if (filters.date_to)           q = q.lte('fecha', filters.date_to)
      if (filters.vet)               q = q.ilike('vet_name', `%${filters.vet}%`)
      if (filters.notificado === 'si')  q = q.eq('propietario_notificado', true)
      if (filters.notificado === 'no')  q = q.eq('propietario_notificado', false)
      q = q.in('horse_id', matches.map((m: any) => m.id))
      const { data } = await q.order('fecha', { ascending: false }).limit(500)
      rows = data ?? []
    }
  } else {
    let q = supabase.from('euthanasia').select('*, horses(name)')
    if (filters.date_from)         q = q.gte('fecha', filters.date_from)
    if (filters.date_to)           q = q.lte('fecha', filters.date_to)
    if (filters.vet)               q = q.ilike('vet_name', `%${filters.vet}%`)
    if (filters.notificado === 'si')  q = q.eq('propietario_notificado', true)
    if (filters.notificado === 'no')  q = q.eq('propietario_notificado', false)
    const { data } = await q.order('fecha', { ascending: false }).limit(500)
    rows = data ?? []
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: PALETTE.primary.green, fontFamily: 'var(--font-sans)' }}>
            Reporte — Eutanasias
          </h1>
          <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>Registro histórico de eutanasias</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports/medications"><Button size="sm" style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>Medicaciones</Button></Link>
          <Link href="/reports/vetlist"><Button size="sm" style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>Vetlist</Button></Link>
        </div>
      </div>

      {/* Filters */}
      <form method="get" className="rounded-xl p-5 mb-6" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Caballo</label>
            <Input name="horse" defaultValue={filters.horse} placeholder="Nombre..." />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Veterinario</label>
            <Input name="vet" defaultValue={filters.vet} placeholder="Nombre..." />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Desde</label>
            <Input type="date" name="date_from" defaultValue={filters.date_from} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Hasta</label>
            <Input type="date" name="date_to" defaultValue={filters.date_to} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Propietario</label>
            <select name="notificado" defaultValue={filters.notificado ?? ''} className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
              style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border, color: PALETTE.text.primary }}>
              <option value="">Todos</option>
              <option value="si">Notificado</option>
              <option value="no">No notificado</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" style={{ background: PALETTE.primary.green, color: '#FFFFFF' }} className="flex-1">Filtrar</Button>
            <Link href="/reports/euthanasia"><Button variant="ghost" type="button">✕</Button></Link>
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
                <tr style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                  {['Caballo', 'Fecha de muerte', 'Última Carrera', 'Veterinario', 'Motivo', 'Propietario', 'Documento'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: PALETTE.text.secondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="transition-colors hover:bg-gray-50" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                    <td className="px-4 py-3">
                      <Link href={`/horses/${r.horse_id}`} className="font-medium transition-colors" style={{ color: PALETTE.primary.green }}>
                        {r.horses?.name ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: PALETTE.text.secondary }}>{r.fecha}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: PALETTE.text.secondary }}>{r.fecha_ultima_carrera ?? '—'}</td>
                    <td className="px-4 py-3" style={{ color: PALETTE.text.secondary }}>{r.vet_name}</td>
                    <td className="px-4 py-3 max-w-48 overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: PALETTE.text.secondary }} title={r.motivo}>
                      {r.motivo}
                    </td>
                    <td className="px-4 py-3">
                      {r.propietario_notificado
                        ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: PALETTE.form.successBg, color: PALETTE.primary.green }}>Notificado</span>
                        : <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: PALETTE.form.errorBg, color: PALETTE.status.error }}>No notificado</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.attachment_url
                        ? <a href={r.attachment_url} target="_blank"
                            className="text-xs px-2.5 py-1 rounded-md transition-colors"
                            style={{ color: PALETTE.primary.green, background: PALETTE.background.lightAlt, border: `1px solid ${PALETTE.ui.border}` }}>
                            Ver doc.
                          </a>
                        : <span style={{ color: PALETTE.text.secondary }}>—</span>}
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
