import { requireUser, isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminTabs from '@/components/admin/admin-tabs'
import { updateUserProfile, grantEuthanasiaRole, revokeEuthanasiaRole } from '@/lib/actions/admin'
import ConfirmDeleteButton from '@/components/admin/confirm-delete-button'
import CreateUserModal from '@/components/admin/create-user-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PALETTE } from '@/lib/palette'

export default async function AdminUsersPage() {
  const user = await requireUser()
  if (!isAdmin(user.email!)) redirect('/dashboard')

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
          <h2 className="text-sm font-semibold text-white">Usuarios del Sistema</h2>
          <p className="text-xs mt-1" style={{ color: PALETTE.text.secondary }}>Gestiona nombre y permisos de cada veterinario</p>
        </div>
        <CreateUserModal />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#131829', border: '1px solid #252d4a' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid #252d4a' }}>
                {['Email', 'Nombre', 'Apellido', 'Último acceso', '', 'Permisos'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: PALETTE.text.secondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid #1e2235' }}>
                  <td className="px-5 py-3 text-sm" style={{ color: '#e2e8f0' }}>{u.email}</td>

                  <form action={updateUserProfile.bind(null, u.id)} style={{ display: 'contents' }}>
                    <td className="px-5 py-2.5">
                      <Input name="first_name" defaultValue={u.first_name} placeholder="Nombre" className="h-8 text-sm w-32" />
                    </td>
                    <td className="px-5 py-2.5">
                      <Input name="last_name" defaultValue={u.last_name} placeholder="Apellido" className="h-8 text-sm w-36" />
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: PALETTE.text.secondary }}>
                      {u.last_sign_in_at ? u.last_sign_in_at.slice(0, 10) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Button type="submit" size="sm" style={{ background: '#2B55F4' }} className="text-xs">
                        Guardar
                      </Button>
                    </td>
                  </form>

                  <td className="px-5 py-3">
                    {u.roles.includes('euthanasia') ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ background: '#2d0a0a', color: '#fca5a5', border: '1px solid #7f1d1d60' }}>
                          Eutanasia
                        </span>
                        <ConfirmDeleteButton
                          action={revokeEuthanasiaRole.bind(null, u.id)}
                          message={`¿Revocar permiso de eutanasia a ${u.email}?`}
                          className="text-xs underline"
                          style={{ background: 'none', border: 'none', color: PALETTE.text.secondary, cursor: 'pointer' }}>
                          Revocar
                        </ConfirmDeleteButton>
                      </div>
                    ) : (
                      <form action={grantEuthanasiaRole.bind(null, u.id)}>
                        <button type="submit"
                          className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                          style={{ background: '#1a0f0f', border: '1px solid #7f1d1d40', color: '#9ca3af', cursor: 'pointer' }}>
                          + Dar acceso eutanasia
                        </button>
                      </form>
                    )}
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
