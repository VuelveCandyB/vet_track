import { requirePageAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import AdminTabs from '@/components/admin/admin-tabs'
import UserRow from '@/components/admin/user-row'
import CreateUserModal from '@/components/admin/create-user-modal'
import { Button } from '@/components/ui/button'
import { PALETTE } from '@/lib/palette'

export default async function AdminUsersPage() {
  await requirePageAccess('page.admin')

  const supabase = await createClient()

  const [{ data: usersRaw }, { data: profiles }, { data: rolesRows }] = await Promise.all([
    supabase.rpc('list_auth_users'),
    supabase.from('profiles').select('*'),
    supabase.from('user_roles').select('user_id, role'),
  ])

  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))
  const rolesMap: Record<string, string[]> = {}
  for (const r of rolesRows ?? []) {
    rolesMap[r.user_id] = rolesMap[r.user_id] ?? []
    rolesMap[r.user_id].push(r.role)
  }

  const users = (usersRaw ?? []).map((u: any) => ({
    ...u,
    first_name: profileMap[u.id]?.first_name ?? '',
    last_name:  profileMap[u.id]?.last_name ?? '',
    roles:      rolesMap[u.id] ?? [],
    notify_vaccinations: profileMap[u.id]?.notify_vaccinations ?? false,
    license_number: profileMap[u.id]?.license_number ?? '',
    license_renewal_date: profileMap[u.id]?.license_renewal_date ?? '',
    phone1: profileMap[u.id]?.phone1 ?? '',
    phone2: profileMap[u.id]?.phone2 ?? '',
    blocked: u.banned_until && new Date(u.banned_until) > new Date(),
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold " style={{ fontFamily: 'var(--font-sans)', color: PALETTE.primary.green }}>Admin</h1>
        <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>Gestión del sistema</p>
      </div>
      <AdminTabs active="users" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: PALETTE.text.dark }}>Usuarios del Sistema</h2>
          <p className="text-xs mt-1" style={{ color: PALETTE.text.secondary }}>Gestiona nombre y permisos de cada veterinario</p>
        </div>
        <CreateUserModal />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                {['Email', 'Nombre', 'Apellido', 'Licencia', 'Renovación', 'Teléfono 1', 'Teléfono 2', 'Último acceso', 'Estado', 'Rol', 'Notif. Vacuna', 'Guardar'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: PALETTE.text.secondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <UserRow key={u.id} user={u} blocked={u.blocked} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
