import { requirePageAccess, requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PALETTE } from '@/lib/palette'
import AdminTabs from '@/components/admin/admin-tabs'

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; date_from?: string; date_to?: string; action?: string }>
}) {
  await requirePageAccess('page.admin')
  const user = await requireUser()
  const searchParamsObj = await searchParams

  const supabase = await createClient()

  // Get list of users for dropdown
  const { data: users } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .order('first_name')

  let query = supabase
    .from('activity_logs')
    .select('id, user_id, user_name, action, entity_type, entity_id, horse_id, description, created_at, horses(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (searchParamsObj.user) {
    query = query.ilike('user_name', `%${searchParamsObj.user}%`)
  }
  if (searchParamsObj.date_from) {
    query = query.gte('created_at', `${searchParamsObj.date_from}T00:00:00Z`)
  }
  if (searchParamsObj.date_to) {
    query = query.lte('created_at', `${searchParamsObj.date_to}T23:59:59Z`)
  }
  if (searchParamsObj.action) {
    query = query.ilike('action', `%${searchParamsObj.action}%`)
  }

  const { data: logs, error } = await query

  if (error) {
    console.error('Logs query error:', error)
  }

  const hasFilters = Object.values(searchParamsObj).some(v => v)

  return (
    <div className="max-w-7xl mx-auto">
      <AdminTabs active="logs" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: PALETTE.primary.green }}>
          Logs de Auditoría
        </h1>
        <p className="text-sm" style={{ color: PALETTE.text.secondary }}>
          Historial de acciones del sistema
        </p>
      </div>

      {/* Filters */}
      <form method="get" className="rounded-lg p-5 mb-6" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Usuario</label>
            <select
              key={`user-${searchParamsObj.user}`}
              name="user"
              defaultValue={searchParamsObj.user || ''}
              style={{ width: '100%', padding: '0.5rem', border: `1px solid ${PALETTE.ui.border}`, borderRadius: '0.375rem', fontSize: '0.875rem' }}
              suppressHydrationWarning
            >
              <option value="">Todos</option>
              {users?.map(u => (
                <option key={u.id} value={`${u.first_name} ${u.last_name}`.trim()}>
                  {`${u.first_name} ${u.last_name}`.trim()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Acción</label>
            <select
              key={`action-${searchParamsObj.action}`}
              name="action"
              defaultValue={searchParamsObj.action || ''}
              style={{ width: '100%', padding: '0.5rem', border: `1px solid ${PALETTE.ui.border}`, borderRadius: '0.375rem', fontSize: '0.875rem' }}
              suppressHydrationWarning
            >
              <option value="">Todas</option>
              <option value="treatment_report.create">Crear Tratamiento</option>
              <option value="treatment_report.update">Editar Tratamiento</option>
              <option value="treatment_report.delete">Eliminar Tratamiento</option>
              <option value="vaccination.create">Registrar Vacunación</option>
              <option value="euthanasia.create">Registrar Eutanasia</option>
              <option value="vetlist.create">Ingreso a Vetlist</option>
              <option value="vetlist.release">Egreso de Vetlist</option>
              <option value="diagnostico.create">Registrar Diagnóstico</option>
              <option value="vaccine_type.create">Crear Tipo de Vacuna</option>
              <option value="vaccine_type.update">Actualizar Tipo de Vacuna</option>
              <option value="horse.create">Crear Caballo</option>
              <option value="medication.create">Registrar Medicación</option>
              <option value="medication.delete">Eliminar Medicación</option>
              <option value="auth.login">Login</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Desde</label>
            <Input key={`date_from-${searchParamsObj.date_from}`} type="date" name="date_from" defaultValue={searchParamsObj.date_from} suppressHydrationWarning />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.text.secondary }}>Hasta</label>
            <Input key={`date_to-${searchParamsObj.date_to}`} type="date" name="date_to" defaultValue={searchParamsObj.date_to} suppressHydrationWarning />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button type="submit" style={{ background: PALETTE.primary.green, color: '#fff' }} className="flex-1 md:flex-none">Filtrar</Button>
        </div>
      </form>

      {hasFilters && (
        <div className="mb-4">
          <Link href="/admin/logs"><Button size="sm" variant="ghost">Limpiar filtros</Button></Link>
        </div>
      )}

      {/* Table */}
      {!logs?.length ? (
        <div className="rounded-lg p-12 text-center" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}`, color: PALETTE.text.secondary }}>
          Sin registros
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                  {['Usuario', 'Acción', 'Entidad', 'Descripción', 'Caballo', 'Fecha'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: PALETTE.text.secondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                    <td className="px-4 py-3" style={{ color: PALETTE.text.primary }}>
                      {log.user_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: PALETTE.ui.border, color: PALETTE.text.secondary }}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: PALETTE.text.secondary }}>
                      {log.entity_type}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: PALETTE.text.secondary }}>
                      {log.description}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: PALETTE.text.secondary }}>
                      {log.horses?.name || log.horse_id || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: PALETTE.text.secondary }}>
                      {new Date(log.created_at).toLocaleString('es-ES', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
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
