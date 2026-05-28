import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import SyncButton from '@/components/horses/sync-button'

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', rest: 'Descanso', injury: 'Lesionado', deceased: 'Fallecido',
}
const STATUS_COLOR: Record<string, string> = {
  active:   'bg-green-950 text-green-400 border-green-900',
  rest:     'bg-yellow-950 text-yellow-400 border-yellow-900',
  injury:   'bg-red-950 text-red-400 border-red-900',
  deceased: 'bg-zinc-900 text-zinc-500 border-zinc-800',
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: '"Dela Gothic One", sans-serif' }}>
            Caballos
          </h1>
          <p className="text-sm mt-1" style={{ color: '#4a5280' }}>
            {total ?? 0} ejemplares registrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncButton />
          <Link href="/horses/new">
            <Button style={{ background: '#2B55F4' }}>+ Nuevo Caballo</Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <form method="get" className="mb-5 flex gap-3 max-w-md">
        <Input name="q" defaultValue={q} placeholder="Buscar por nombre..." className="flex-1" />
        <Button type="submit" variant="secondary">Buscar</Button>
        {q && (
          <Link href="/horses">
            <Button variant="ghost">✕</Button>
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#131829', border: '1px solid #252d4a' }}>
        <div className="px-5 py-3 border-b text-xs" style={{ borderColor: '#252d4a', color: '#4a5280' }}>
          {horses?.length ?? 0} resultado{horses?.length !== 1 ? 's' : ''}
          {q && ` para "${q}"`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid #252d4a' }}>
                {['Nombre', 'Color', 'Estado', 'Género', 'Edad', 'Microchip'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#4a5280' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!horses?.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center" style={{ color: '#4a5280' }}>
                    Sin resultados
                  </td>
                </tr>
              ) : horses.map(horse => (
                <tr key={horse.id}
                  className="transition-colors hover:bg-white/5"
                  style={{ borderBottom: '1px solid #1e2235' }}>
                  <td className="px-4 py-3">
                    <Link href={`/horses/${horse.id}`}
                      className="font-semibold text-white hover:text-blue-400 transition-colors">
                      {horse.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: COLOR_DOT[horse.color] ?? '#6b7399' }} />
                      <span style={{ color: '#9ca3af' }}>{horse.color || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs border ${STATUS_COLOR[horse.status] ?? ''}`}>
                      {STATUS_LABEL[horse.status] ?? horse.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#9ca3af' }}>{horse.gender || '—'}</td>
                  <td className="px-4 py-3" style={{ color: '#9ca3af' }}>
                    {horse.birth_date
                      ? `${todayYear - new Date(horse.birth_date).getFullYear()} años`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {horse.microchip
                      ? <span className="font-mono text-xs px-2 py-0.5 rounded"
                          style={{ background: '#1e2235', color: '#818cf8' }}>
                          {horse.microchip}
                        </span>
                      : <span style={{ color: '#4a5280' }}>—</span>}
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
