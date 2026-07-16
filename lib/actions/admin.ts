'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, isAdmin } from '@/lib/auth'

async function requireAdmin() {
  const user = await requireUser()
  if (!isAdmin(user.email!)) throw new Error('Acceso denegado')
  return user
}

function intOrNull(val: string | null): number | null {
  const v = (val ?? '').trim()
  return v ? parseInt(v) : null
}

// ── CATÁLOGOS ────────────────────────────────────────────────
export async function addCatalogItem(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()
  const category = formData.get('category') as string
  const name = (formData.get('name') as string).trim()
  if (!name) return
  await supabase.from('catalog_items').insert({ category, name })
  revalidatePath('/admin')
}

export async function deleteCatalogItem(itemId: string) {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('catalog_items').update({ active: false }).eq('id', itemId)
  revalidatePath('/admin')
}

// ── MEDICAMENTOS ─────────────────────────────────────────────
export async function createDrug(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()
  const dosis_min_str = (formData.get('dosis_min') as string)?.trim()
  const dosis_max_str = (formData.get('dosis_max') as string)?.trim()
  await supabase.from('drugs').insert({
    nombre:                (formData.get('nombre') as string).trim(),
    nombre_comercial:      (formData.get('nombre_comercial') as string).trim() || null,
    categoria:             (formData.get('categoria') as string).trim(),
    dosis_ruta:            (formData.get('dosis_ruta') as string).trim() || null,
    dosis_min:             dosis_min_str ? parseFloat(dosis_min_str) : null,
    dosis_max:             dosis_max_str ? parseFloat(dosis_max_str) : null,
    dosis_unidad:          (formData.get('dosis_unidad') as string).trim() || null,
    detection_time_horas:  intOrNull(formData.get('detection_time_horas') as string),
    withdrawal_time_horas: intOrNull(formData.get('withdrawal_time_horas') as string),
    tipo_restriccion:      (formData.get('tipo_restriccion') as string).trim() || null,
    nivel_maximo_permitido: (formData.get('nivel_maximo_permitido') as string).trim() || null,
    notas:                 (formData.get('notas') as string).trim() || null,
  })
  revalidatePath('/admin/drugs')
}

export async function updateDrug(drugId: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()
  const dosis_min_str = (formData.get('dosis_min') as string)?.trim()
  const dosis_max_str = (formData.get('dosis_max') as string)?.trim()
  await supabase.from('drugs').update({
    nombre:                (formData.get('nombre') as string).trim(),
    nombre_comercial:      (formData.get('nombre_comercial') as string).trim() || null,
    categoria:             (formData.get('categoria') as string).trim(),
    dosis_ruta:            (formData.get('dosis_ruta') as string).trim() || null,
    dosis_min:             dosis_min_str ? parseFloat(dosis_min_str) : null,
    dosis_max:             dosis_max_str ? parseFloat(dosis_max_str) : null,
    dosis_unidad:          (formData.get('dosis_unidad') as string).trim() || null,
    detection_time_horas:  intOrNull(formData.get('detection_time_horas') as string),
    withdrawal_time_horas: intOrNull(formData.get('withdrawal_time_horas') as string),
    tipo_restriccion:      (formData.get('tipo_restriccion') as string).trim() || null,
    nivel_maximo_permitido: (formData.get('nivel_maximo_permitido') as string).trim() || null,
    notas:                 (formData.get('notas') as string).trim() || null,
  }).eq('id', drugId)
  revalidatePath('/admin/drugs')
}

export async function deleteDrug(drugId: string) {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('drugs').delete().eq('id', drugId)
  revalidatePath('/admin/drugs')
}

// ── USUARIOS ─────────────────────────────────────────────────
export async function updateUserProfile(userId: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('profiles').upsert({
    id:                     userId,
    first_name:             (formData.get('first_name') as string).trim(),
    last_name:              (formData.get('last_name') as string).trim(),
    license_number:         (formData.get('license_number') as string || '').trim() || null,
    license_renewal_date:   (formData.get('license_renewal_date') as string || '').trim() || null,
    phone1:                 (formData.get('phone1') as string || '').trim() || null,
    phone2:                 (formData.get('phone2') as string || '').trim() || null,
    updated_at:             new Date().toISOString(),
  }, { onConflict: 'id' })
  revalidatePath('/admin/users')
}

export async function grantEuthanasiaRole(userId: string) {
  const user = await requireAdmin()
  const supabase = await createClient()
  await supabase.from('user_roles').insert({ user_id: userId, role: 'euthanasia', granted_by: user.id })
  revalidatePath('/admin/users')
}

export async function revokeEuthanasiaRole(userId: string) {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'euthanasia')
  revalidatePath('/admin/users')
}

export async function grantOfficialVetRole(userId: string) {
  const user = await requireAdmin()
  const supabase = await createClient()
  await supabase.from('user_roles').insert({ user_id: userId, role: 'official_vet', granted_by: user.id })
  revalidatePath('/admin/users')
}

export async function revokeOfficialVetRole(userId: string) {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'official_vet')
  revalidatePath('/admin/users')
}

export async function setVaccinationNotifications(userId: string, enabled: boolean) {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('profiles').upsert({ id: userId, notify_vaccinations: enabled }, { onConflict: 'id' })
  revalidatePath('/admin/users')
}

// ── GESTIÓN DE ROLES (multi-rol) ────
export async function setUserRoles(userId: string, roles: string[]) {
  const user = await requireAdmin()
  const supabase = await createClient()

  const validRoles = ['authorized_vet', 'official_vet', 'euthanasia', 'director']
  for (const role of roles) {
    if (!validRoles.includes(role)) {
      throw new Error(`Rol inválido: ${role}`)
    }
  }

  // Get current roles
  const { data: currentRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  const currentRoleSet = new Set((currentRoles ?? []).map(r => r.role))
  const newRoleSet = new Set(roles)

  // Delete roles that are no longer needed
  const rolesToDelete = [...currentRoleSet].filter(r => !newRoleSet.has(r))
  if (rolesToDelete.length > 0) {
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .in('role', rolesToDelete)
  }

  // Insert new roles
  const rolesToInsert = [...newRoleSet].filter(r => !currentRoleSet.has(r))
  if (rolesToInsert.length > 0) {
    await supabase.from('user_roles').insert(
      rolesToInsert.map(role => ({
        user_id: userId,
        role: role,
        granted_by: user.id,
      }))
    )
  }

  revalidatePath('/admin/users')
}

// ── CREAR USUARIO ────────────────────────────────────────────
export async function createUser(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin()

  const email                = (formData.get('email') as string).trim()
  const password             = (formData.get('password') as string).trim()
  const firstName            = (formData.get('first_name') as string).trim()
  const lastName             = (formData.get('last_name') as string).trim()
  const licenseNumber        = (formData.get('license_number') as string || '').trim() || null
  const licenseRenewalDate   = (formData.get('license_renewal_date') as string || '').trim() || null
  const phone1               = (formData.get('phone1') as string || '').trim() || null
  const phone2               = (formData.get('phone2') as string || '').trim() || null
  const grantEuth            = formData.get('euthanasia') === 'on'

  if (!email || !password) return { error: 'Email y contraseña son requeridos' }
  if (password.length < 6)  return { error: 'La contraseña debe tener al menos 6 caracteres' }

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  })

  if (error) return { error: error.message }

  const userId = data.user.id
  const supabase = await createClient()

  await Promise.all([
    supabase.from('profiles').upsert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      license_number: licenseNumber,
      license_renewal_date: licenseRenewalDate,
      phone1: phone1,
      phone2: phone2,
    }, { onConflict: 'id' }),
    ...(grantEuth ? [supabase.from('user_roles').insert({
      user_id: userId, role: 'euthanasia',
    })] : []),
  ])

  revalidatePath('/admin/users')
  return {}
}
