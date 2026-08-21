import { requireUser, isAdmin, isOfficialVet, can, isTechnician } from '@/lib/auth'
import { getVetName } from '@/lib/actions/shared'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const supabase = await createClient()
  const isAdminUser = await isAdmin(user.id, user.email || '')
  const officialVet = await isOfficialVet(user.id, user.email || '')
  const isTech = await isTechnician(user.id, user.email || '')
  const canAccessAdmin = await can(user, 'page.admin', 'view')
  const canAccessRaceDay = await can(user, 'page.race_day', 'view')

  // Gate: if technician, check active_vet_id and potentially redirect
  let activeVetId: string | null = null
  let showVetSwitcher = false
  if (isTech) {
    const { data: profile } = await supabase.from('profiles').select('active_vet_id').eq('id', user.id).single()
    activeVetId = profile?.active_vet_id ?? null

    const { data: supervisors } = await supabase
      .from('technician_supervisors')
      .select('vet_id')
      .eq('technician_id', user.id)

    const vetIds = supervisors?.map(s => s.vet_id) ?? []

    if (!activeVetId) {
      if (vetIds.length === 0) {
        // Technician has no supervisors assigned — this is an error state
        redirect('/error-sin-medicos')
      } else if (vetIds.length === 1) {
        // Auto-activate the single supervisor
        activeVetId = vetIds[0]
        await supabase.from('profiles').update({ active_vet_id: activeVetId }).eq('id', user.id)
      } else {
        // 2+ supervisors — redirect to selection
        redirect('/seleccionar-medico')
      }
    } else if (vetIds.length > 1) {
      showVetSwitcher = true
    }
  }

  const vetName = await getVetName(supabase, user)
  let activeVetName: string | null = null
  if (activeVetId) {
    const { data: activeVetProfile } = await supabase.from('profiles').select('first_name, last_name').eq('id', activeVetId).single()
    if (activeVetProfile) {
      activeVetName = `${activeVetProfile.first_name ?? ''} ${activeVetProfile.last_name ?? ''}`.trim()
    }
  }

  let canAccessRevisiones = false
  let pendingReviewCount = 0

  const canReview = await can(user, 'page.revisiones', 'view')
  if (canReview) {
    canAccessRevisiones = true
    const { count } = await supabase
      .from('treatment_reports')
      .select('id', { count: 'exact', head: true })
      .eq('created_for_vet_id', user.id)
      .is('reviewed_by', null)
    pendingReviewCount = count ?? 0
  }

  return (
    <div className="min-h-[100dvh] flex flex-col w-full">
      <Navbar
        user={user}
        isAdmin={isAdminUser}
        isOfficialVet={officialVet}
        vetName={vetName}
        canAccessAdmin={canAccessAdmin}
        canAccessRaceDay={canAccessRaceDay}
        canAccessRevisiones={canAccessRevisiones}
        pendingReviewCount={pendingReviewCount}
        isTechnician={isTech}
        activeVetName={activeVetName}
        showVetSwitcher={showVetSwitcher}
      />
      <main className="flex-1 w-full min-w-0 px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
