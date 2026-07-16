import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAIL } from '@/lib/constants'
import { PERMISSIONS, type Role, type Level, hasPermission } from '@/lib/permissions'
import type { User } from '@supabase/supabase-js'

export function isAdmin(email: string) {
  return email === ADMIN_EMAIL
}

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) redirect('/login')
  return user
}

export async function getUserRoles(userId: string, email: string): Promise<Role[]> {
  if (isAdmin(email)) {
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
  if (isAdmin(user.email!)) {
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
    authorized_vet: roles.includes('authorized_vet') ? permDef.authorized_vet : undefined,
    official_vet: roles.includes('official_vet') ? permDef.official_vet : undefined,
    director: roles.includes('director') ? permDef.director : undefined,
    euthanasia: roles.includes('euthanasia') ? permDef.euthanasia : undefined,
  }

  return hasPermission(userLevels, minLevel)
}

export async function canRegisterEuthanasia(userId: string, email: string): Promise<boolean> {
  if (isAdmin(email)) return true
  const roles = await getUserRoles(userId, email)
  return roles.includes('euthanasia')
}

export async function isOfficialVet(userId: string, email: string): Promise<boolean> {
  if (isAdmin(email)) return true
  const roles = await getUserRoles(userId, email)
  return roles.includes('official_vet')
}

export async function isAuthorizedVet(userId: string, email: string): Promise<boolean> {
  if (isAdmin(email)) return true
  const roles = await getUserRoles(userId, email)
  return roles.includes('authorized_vet')
}

export async function requirePageAccess(pageKey: string): Promise<void> {
  const user = await requireUser()
  const allowed = await can(user, pageKey, 'view')
  if (!allowed) redirect('/dashboard')
}
