'use server'
import { requireUser, isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function getUserRoles(): Promise<string[]> {
  const user = await requireUser()

  // Check if admin (by email)
  if (await isAdmin(user.id, user.email!)) {
    return ['admin']
  }

  // Get roles from user_roles table
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  return (data ?? []).map(r => r.role)
}
