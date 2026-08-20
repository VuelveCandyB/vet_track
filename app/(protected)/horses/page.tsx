import { requirePageAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import SyncButton from '@/components/horses/sync-button'
import SearchForm from '@/components/horses/search-form'
import { PALETTE } from '@/lib/palette'

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', rest: 'Descanso', injury: 'Lesionado', deceased: 'Fallecido',
}
const STATUS_COLOR: Record<string, string> = {
  active:   'bg-green-100 text-green-800 border-green-300',
  rest:     'bg-yellow-100 text-yellow-800 border-yellow-300',
  injury:   'bg-red-100 text-red-800 border-red-300',
  deceased: 'bg-gray-100 text-gray-700 border-gray-300',
}
const COLOR_DOT: Record<string, string> = {
  'Bay':      '#c2852c',
  'Dark Bay': '#5a4a2a',
  'Chestnut': '#c05a1e',
  'Grey':     '#8a9ab0',
  'Roan':     '#9a6a8a',
  'Black':    '#4a4a5a',
}

export default async function HorsesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requirePageAccess('page.horses')
  const { q = '' } = await searchParams
  const supabase = await createClient()

  const query = supabase
    .from('horses')
    .select('id, name, color, status, microchip, birth_date, gender, red_flag')
    .order('name')
    .limit(q ? 2000 : 200)

  if (q) query.or(`name.ilike.%${q}%,microchip.ilike.%${q}%`)

  const [{ data: horses }, { count: total }, { data: vetlistData }, { data: vetlistAllData }, { data: referidosData }] = await Promise.all([
    query,
    supabase.from('horses').select('id', { count: 'exact', head: true }),
    supabase.from('vetlist').select('horse_id').is('fecha_egreso', null),
    supabase.from('vetlist').select('horse_id'),
    supabase.from('horse_referidos').select('horse_id'),
  ])

  const vetlistActiveIds = new Set((vetlistData || []).map((v: any) => v.horse_id))

  // Build count maps for historical vetlist and referido counts
  const vetlistCounts = new Map<string, number>()
  for (const v of vetlistAllData || []) {
    vetlistCounts.set(v.horse_id, (vetlistCounts.get(v.horse_id) ?? 0) + 1)
  }

  const referidoCounts = new Map<string, number>()
  for (const r of referidosData || []) {
    referidoCounts.set(r.horse_id, (referidoCounts.get(r.horse_id) ?? 0) + 1)
  }

  const todayYear = new Date().getFullYear()

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-sans)', color: PALETTE.primary.green }}>
            Listado de Caballos
          </h1>
          <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>
            {total ?? 0} ejemplares registrados
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SyncButton />
        </div>
      </div>

      {/* Search */}
      <SearchForm />

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <div className="px-5 py-3 border-b text-xs" style={{ borderColor: PALETTE.ui.border, color: PALETTE.text.secondary }}>
          {horses?.length ?? 0} resultado{horses?.length !== 1 ? 's' : ''}
          {q && ` para "${q}"`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                {['Nombre', 'Color', 'Estado', 'Indicadores', 'Género', 'Edad', 'Microchip'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: PALETTE.text.secondary }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!horses?.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center" style={{ color: PALETTE.text.secondary }}>
                    Sin resultados
                  </td>
                </tr>
              ) : horses.map(horse => (
                <tr key={horse.id}
                  className="transition-colors hover:bg-[#05966920]"
                  style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                  <td className="px-4 py-3">
                    <Link href={`/horses/${horse.id}`}
                      className="font-semibold transition-colors hover:text-[#059669] flex items-center gap-2" style={{ color: PALETTE.text.primary }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://res.cloudinary.com/dee0x7p16/image/upload/v1780762906/HC_Icono-Cabeza_Azul-Oscuro_jvimak.png" alt="caballo" className="h-5 w-5" />
                      {horse.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: COLOR_DOT[horse.color] ?? '#6b7399' }} />
                      <span style={{ color: PALETTE.text.secondary }}>{horse.color || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs border ${STATUS_COLOR[horse.status] ?? ''}`}>
                      {STATUS_LABEL[horse.status] ?? horse.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {referidoCounts.has(horse.id) && (
                        <Badge className="text-xs border bg-red-100 text-red-800 border-red-300">
                          Referido ×{referidoCounts.get(horse.id)}
                        </Badge>
                      )}
                      {vetlistCounts.has(horse.id) && (
                        <Badge className="text-xs border bg-orange-100 text-orange-800 border-orange-300">
                          Vetlist ×{vetlistCounts.get(horse.id)}
                        </Badge>
                      )}
                      {!referidoCounts.has(horse.id) && !vetlistCounts.has(horse.id) && (
                        <span style={{ color: PALETTE.text.secondary }}>—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: PALETTE.text.secondary }}>{horse.gender || '—'}</td>
                  <td className="px-4 py-3" style={{ color: PALETTE.text.secondary }}>
                    {horse.birth_date
                      ? `${todayYear - new Date(horse.birth_date).getFullYear()} años`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {horse.microchip
                      ? <span className="font-mono text-xs px-2 py-0.5 rounded"
                          style={{ background: PALETTE.background.lightAlt, color: PALETTE.primary.green }}>
                          {horse.microchip}
                        </span>
                      : <span style={{ color: PALETTE.text.secondary }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
