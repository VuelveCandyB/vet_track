'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser, isTechnician } from '@/lib/auth'

export async function setActiveVet(vetId: string) {
  const user = await requireUser()
  const supabase = await createClient()

  // Validate that vetId is in technician_supervisors for this user
  const { data: supervisorRecord } = await supabase
    .from('technician_supervisors')
    .select('vet_id')
    .eq('technician_id', user.id)
    .eq('vet_id', vetId)
    .single()

  if (!supervisorRecord) {
    throw new Error('Este médico no está asignado a ti')
  }

  // Update active_vet_id
  const { error } = await supabase
    .from('profiles')
    .update({ active_vet_id: vetId })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
}

export async function clearActiveVetOnLogout() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const isTech = await isTechnician(user.id, user.email!)
    if (!isTech) return

    // Clear active_vet_id on logout to force re-selection on next login
    await supabase
      .from('profiles')
      .update({ active_vet_id: null })
      .eq('id', user.id)
  } catch {
    // Ignore errors in logout flow
  }
}
