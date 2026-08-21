import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAIL } from '@/lib/constants'
import { PERMISSIONS, type Role, type Level, hasPermission } from '@/lib/permissions'
import type { User } from '@supabase/supabase-js'

export async function isAdmin(userId: string, email: string): Promise<boolean> {
  if (email === ADMIN_EMAIL) return true
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle()
  return !!data
}

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) redirect('/login')
  return user
}

export async function getUserRoles(userId: string, email: string): Promise<Role[]> {
  if (await isAdmin(userId, email)) {
    // Admin doesn't use role rows; return empty array (admin is checked separately)
    return []
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  return (data ?? []).map(r => r.role as Role)
}

export async function can(user: User, key: string, minLevel: Level = 'view'): Promise<boolean> {
  if (await isAdmin(user.id, user.email!)) {
    return true
  }

  const roles = await getUserRoles(user.id, user.email!)
  const permDef = PERMISSIONS[key]

  if (!permDef) {
    // Key not found in PERMISSIONS — deny by default
    return false
  }

  // Only include roles the user actually has
  const userLevels: Record<Role, Level | undefined> = {
    admin: undefined, // Admin always has full access via isAdmin check above
    authorized_vet: roles.includes('authorized_vet') ? permDef.authorized_vet : undefined,
    official_vet: roles.includes('official_vet') ? permDef.official_vet : undefined,
    director: roles.includes('director') ? permDef.director : undefined,
    euthanasia: roles.includes('euthanasia') ? permDef.euthanasia : undefined,
    technician: roles.includes('technician') ? permDef.technician : undefined,
  }

  return hasPermission(userLevels, minLevel)
}

export async function canRegisterEuthanasia(userId: string, email: string): Promise<boolean> {
  if (await isAdmin(userId, email)) return true
  const roles = await getUserRoles(userId, email)
  return roles.includes('euthanasia')
}

export async function isOfficialVet(userId: string, email: string): Promise<boolean> {
  if (await isAdmin(userId, email)) return true
  const roles = await getUserRoles(userId, email)
  return roles.includes('official_vet')
}

export async function isAuthorizedVet(userId: string, email: string): Promise<boolean> {
  if (await isAdmin(userId, email)) return true
  const roles = await getUserRoles(userId, email)
  return roles.includes('authorized_vet')
}

export async function isTechnician(userId: string, email: string): Promise<boolean> {
  if (await isAdmin(userId, email)) return false
  const roles = await getUserRoles(userId, email)
  return roles.includes('technician')
}

export async function requirePageAccess(pageKey: string): Promise<void> {
  const user = await requireUser()
  const allowed = await can(user, pageKey, 'view')
  if (!allowed) redirect('/dashboard')
}
