import { requireUser, isAdmin, isOfficialVet, can } from '@/lib/auth'
import Navbar from '@/components/layout/navbar'
import { createClient } from '@/lib/supabase/server'

async function getVetName(userId: string) {
  const supabase = await createClient()
  try {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single()

    if (data) {
      const full = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim()
      if (full) return full
    }
  } catch {}
  return 'Veterinario'
}

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const isAdminUser = isAdmin(user.email || '')
  const officialVet = await isOfficialVet(user.id, user.email || '')
  const vetName = await getVetName(user.id)
  const canAccessAdmin = await can(user, 'page.admin', 'view')
  const canAccessRaceDay = await can(user, 'page.race_day', 'view')

  return (
    <div className="min-h-[100dvh] flex flex-col w-full">
      <Navbar user={user} isAdmin={isAdminUser} isOfficialVet={officialVet} vetName={vetName} canAccessAdmin={canAccessAdmin} canAccessRaceDay={canAccessRaceDay} />
      <main className="flex-1 w-full min-w-0 px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
