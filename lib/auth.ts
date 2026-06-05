import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAIL } from '@/lib/constants'

export function isAdmin(email: string) {
  return email === ADMIN_EMAIL
}

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) redirect('/login')
  return user
}

export async function canRegisterEuthanasia(userId: string, email: string): Promise<boolean> {
  if (isAdmin(email)) return true
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role', 'euthanasia')
    .single()
  return !!data
}

export async function isOfficialVet(userId: string, email: string): Promise<boolean> {
  if (isAdmin(email)) return true
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role', 'official_vet')
    .maybeSingle()
  return !!data
}
