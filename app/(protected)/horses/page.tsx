import { requirePageAccess, requireUser, isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import HorseImportModal from '@/components/horses/horse-import-modal'
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
  'BAY':      '#c2852c',
  'DKBAY':    '#5a4a2a',
  'CHEST':    '#c05a1e',
  'GREY':     '#8a9ab0',
  'PAINT':    '#a89968',
  'ROAN':     '#9a6a8a',
  'BLACK':    '#4a4a5a',
}

const COLOR_LABEL: Record<string, string> = {
  'BAY':      'Bayo',
  'DKBAY':    'Bayo Oscuro',
  'CHEST':    'Alazán',
  'GREY':     'Gris',
  'PAINT':    'Pinto',
  'ROAN':     'Ruano',
  'BLACK':    'Negro',
}

const PAGE_SIZE = 50

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default async function HorsesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; letter?: string }>
}) {
  await requirePageAccess('page.horses')
  const user = await requireUser()
  const admin = await isAdmin(user.id, user.email!)
  const { q = '', page = '1', letter = '' } = await searchParams
  const currentPage = Math.max(1, parseInt(page, 10))
  const offset = (currentPage - 1) * PAGE_SIZE
  const supabase = await createClient()

  const query = supabase
    .from('horses')
    .select('id, name, color, status, microchip, birth_date, gender, red_flag', { count: 'exact' })
    .order('name')
    .limit(PAGE_SIZE)
    .range(offset, offset + PAGE_SIZE - 1)

  if (q) query.or(`name.ilike.%${q}%,microchip.ilike.%${q}%`)
  if (letter) query.ilike('name', `${letter}%`)

  const [{ data: horses, count: paginatedCount }, { count: total }, { data: vetlistData }, { data: vetlistAllData }, { data: referidosData }] = await Promise.all([
    query,
    supabase.from('horses').select('id', { count: 'exact', head: true }),
    supabase.from('vetlist').select('horse_id').is('fecha_egreso', null),
    supabase.from('vetlist').select('horse_id'),
    supabase.from('horse_referidos').select('horse_id'),
  ])

  const totalPages = Math.ceil((paginatedCount || 0) / PAGE_SIZE)

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
          {admin && <HorseImportModal />}
        </div>
      </div>

      {/* Search */}
      <SearchForm />

      {/* Alphabet Filter */}
      <div className="mb-4 p-4 rounded-lg flex flex-wrap gap-2 hidden md:flex" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <div style={{ color: PALETTE.text.secondary }} className="text-xs font-semibold self-center mr-2">
          Filtrar por letra:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {letter && (
            <Link
              href={`/horses?page=1${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className="px-2.5 py-1 text-xs font-medium rounded border transition-all"
              style={{
                borderColor: PALETTE.ui.border,
                color: PALETTE.text.secondary,
                background: 'transparent',
              }}
            >
              ✕ Limpiar
            </Link>
          )}
          {ALPHABET.map((char) => (
            <Link
              key={char}
              href={`/horses?page=1&letter=${char}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className="px-2.5 py-1 text-xs font-medium rounded border transition-all"
              style={{
                borderColor: letter === char ? PALETTE.primary.green : PALETTE.ui.border,
                color: letter === char ? PALETTE.primary.green : PALETTE.text.primary,
                background: 'transparent',
              }}
            >
              {char}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <div className="px-5 py-3 border-b text-xs flex items-center justify-between" style={{ borderColor: PALETTE.ui.border, color: PALETTE.text.secondary }}>
          <div>
            {horses?.length ?? 0} resultado{horses?.length !== 1 ? 's' : ''}
            {q && ` para "${q}"`}
          </div>
          <div style={{ color: PALETTE.text.secondary }} className="text-xs">
            Página {currentPage} de {totalPages || 1}
          </div>
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
                      <span style={{ color: PALETTE.text.secondary }}>{COLOR_LABEL[horse.color] || horse.color || '—'}</span>
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
                        horse.red_flag
                          ? <Badge className="text-xs border bg-red-100 text-red-800 border-red-300">
                              Referido ×{referidoCounts.get(horse.id)}
                            </Badge>
                          : <span className="text-xs" style={{ color: PALETTE.text.secondary }}>
                              Referido ×{referidoCounts.get(horse.id)}
                            </span>
                      )}
                      {vetlistCounts.has(horse.id) && (
                        vetlistActiveIds.has(horse.id)
                          ? <Badge className="text-xs border bg-orange-100 text-orange-800 border-orange-300">
                              Vetlist ×{vetlistCounts.get(horse.id)}
                            </Badge>
                          : <span className="text-xs" style={{ color: PALETTE.text.secondary }}>
                              Vetlist ×{vetlistCounts.get(horse.id)}
                            </span>
                      )}
                      {!referidoCounts.has(horse.id) && !vetlistCounts.has(horse.id) && (
                        <span style={{ color: PALETTE.text.secondary }}>—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {horse.gender === 'M' && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                        M
                      </span>
                    )}
                    {horse.gender === 'H' && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: '#fce7f3', color: '#9d174d' }}>
                        H
                      </span>
                    )}
                    {!horse.gender && <span style={{ color: PALETTE.text.secondary }}>—</span>}
                  </td>
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t flex items-center justify-between" style={{ borderColor: PALETTE.ui.border }}>
            <div style={{ color: PALETTE.text.secondary }} className="text-xs">
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, paginatedCount || 0)} de {paginatedCount || 0}
            </div>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/horses?page=${currentPage - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${letter ? `&letter=${letter}` : ''}`}
                  className="px-3 py-2 text-sm rounded border transition-all hover:opacity-80"
                  style={{
                    borderColor: PALETTE.ui.border,
                    color: PALETTE.primary.green,
                  }}
                >
                  ← Anterior
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/horses?page=${currentPage + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${letter ? `&letter=${letter}` : ''}`}
                  className="px-3 py-2 text-sm rounded border transition-all hover:opacity-80"
                  style={{
                    borderColor: PALETTE.ui.border,
                    color: PALETTE.primary.green,
                  }}
                >
                  Siguiente →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
