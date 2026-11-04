import { requirePageAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PALETTE } from '@/lib/palette'
import type { ServiceTicket } from '@/lib/types'
import AdminTabs from '@/components/admin/admin-tabs'
import TicketResolveForm from '@/components/admin/ticket-resolve-form'

type Filter = 'pendientes' | 'resueltos' | 'todos'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pendientes', label: 'Pendientes' },
  { key: 'resueltos', label: 'Resueltos' },
  { key: 'todos', label: 'Todos' },
]

const formatFecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('es-PR', { timeZone: 'America/Puerto_Rico', dateStyle: 'medium', timeStyle: 'short' }) : '—'

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  await requirePageAccess('page.admin')

  const { estado } = await searchParams
  const filter: Filter = estado === 'resueltos' || estado === 'todos' ? estado : 'pendientes'

  const supabase = await createClient()

  let query = supabase
    .from('service_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (filter === 'pendientes') query = query.eq('status', 'pendiente')
  if (filter === 'resueltos') query = query.eq('status', 'resuelto')

  const [{ data: tickets, error }, { count: pendientes }] = await Promise.all([
    query,
    supabase.from('service_tickets').select('id', { count: 'exact', head: true }).eq('status', 'pendiente'),
  ])

  if (error) console.error('Tickets query error:', error)

  const lista = (tickets ?? []) as ServiceTicket[]

  return (
    <div className="max-w-5xl mx-auto">
      <AdminTabs active="tickets" />

      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: PALETTE.primary.green }}>Soporte</h1>
          <p className="text-sm" style={{ color: PALETTE.text.secondary }}>
            Tickets SOS de los veterinarios
          </p>
        </div>
        <p className="text-sm font-medium" style={{ color: PALETTE.text.primary }}>
          {pendientes ?? 0} pendiente{(pendientes ?? 0) === 1 ? '' : 's'}
        </p>
      </div>

      <div className="flex gap-1 mb-5">
        {FILTERS.map(f => (
          <Link key={f.key} href={f.key === 'pendientes' ? '/admin/tickets' : `/admin/tickets?estado=${f.key}`}
            className="px-3 py-1.5 text-sm rounded-md"
            style={filter === f.key
              ? { background: PALETTE.primary.green, color: '#FFFFFF' }
              : { color: PALETTE.text.secondary, border: `1px solid ${PALETTE.ui.border}` }}>
            {f.label}
          </Link>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="rounded-lg p-12 text-center" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}`, color: PALETTE.text.secondary }}>
          Sin tickets
        </div>
      ) : (
        <div className="space-y-4">
          {lista.map(t => {
            const resuelto = t.status === 'resuelto'
            return (
              <div key={t.id} className="rounded-lg p-5" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
                <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: PALETTE.text.dark }}>{t.situacion}</p>
                    <p className="text-xs" style={{ color: PALETTE.text.secondary }}>
                      {t.vet_name} · {t.vet_email} · {formatFecha(t.created_at)}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={resuelto
                      ? { background: '#dcfce7', color: '#166534' }
                      : { background: '#fef3c7', color: '#92400e' }}>
                    {resuelto ? 'Resuelto' : 'Pendiente'}
                  </span>
                </div>

                <p className="text-sm whitespace-pre-wrap mb-4" style={{ color: PALETTE.text.primary }}>{t.detalle}</p>

                {resuelto && (
                  <p className="text-xs mb-3" style={{ color: PALETTE.text.secondary }}>
                    Resuelto por {t.resuelto_por_nombre ?? '—'} el {formatFecha(t.resuelto_en)}
                  </p>
                )}

                <TicketResolveForm ticketId={t.id} notasIniciales={t.notas} resuelto={resuelto} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
