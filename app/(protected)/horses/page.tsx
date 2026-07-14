import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import SyncButton from '@/components/horses/sync-button'
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
  await requireUser()
  const { q = '' } = await searchParams
  const supabase = await createClient()

  const query = supabase
    .from('horses')
    .select('id, name, color, status, microchip, birth_date, gender')
    .order('name')
    .limit(q ? 2000 : 200)

  if (q) query.ilike('name', `%${q}%`)

  const [{ data: horses }, { count: total }] = await Promise.all([
    query,
    supabase.from('horses').select('id', { count: 'exact', head: true }),
  ])

  const todayYear = new Date().getFullYear()

  return (
    <div>
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
      <form method="get" className="mb-5 flex gap-3 w-full max-w-md">
        <Input name="q" defaultValue={q} placeholder="Buscar por nombre..." className="flex-1" />
        <Button type="submit" variant="secondary">Buscar</Button>
        {q && (
          <Link href="/horses">
            <Button variant="ghost">✕</Button>
          </Link>
        )}
      </form>

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
                {['Nombre', 'Color', 'Estado', 'Género', 'Edad', 'Microchip'].map(h => (
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
                  <td colSpan={5} className="px-4 py-12 text-center" style={{ color: PALETTE.text.secondary }}>
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
