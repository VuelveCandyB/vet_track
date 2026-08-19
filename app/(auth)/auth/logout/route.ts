import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { clearActiveVetOnLogout } from '@/lib/actions/technician'

export async function POST() {
  // Clear active_vet_id for technicians before logout
  await clearActiveVetOnLogout()

  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect('/login')
}
