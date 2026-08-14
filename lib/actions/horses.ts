'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser, can } from '@/lib/auth'
import { getVetName } from './shared'

export async function createHorse(formData: FormData) {
  const user = await requireUser()
  const allowed = await can(user, 'horses.create', 'full')
  if (!allowed) throw new Error('Acceso denegado')
  const supabase = await createClient()

  const payload = {
    name:         (formData.get('name') as string).toUpperCase().trim(),
    color:        formData.get('color') as string,
    registration: (formData.get('registration') as string) || null,
    owner:        (formData.get('owner') as string) || null,
    trainer:      (formData.get('trainer') as string) || null,
    status:       (formData.get('status') as string) || 'active',
    birth_date:   (formData.get('birth_date') as string) || null,
  }

  const { data, error } = await supabase.from('horses').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  redirect(`/horses/${data.id}`)
}

export async function setRedFlag(horseId: string, formData: FormData) {
  const user = await requireUser()
  const supabase = await createClient()
  const vetName = await getVetName(supabase, user)
  const reason = (formData.get('reason') as string || '').trim()

  if (!reason) throw new Error('El motivo es obligatorio')

  const { error } = await supabase.from('horses').update({
    red_flag: true,
    red_flag_reason: reason,
    red_flag_by: vetName,
    red_flag_date: new Date().toISOString(),
  }).eq('id', horseId)

  if (error) throw new Error(error.message)

  revalidatePath(`/horses/${horseId}`)
  revalidatePath('/dashboard')
}

export async function clearRedFlag(horseId: string) {
  await requireUser()
  const supabase = await createClient()

  const { error } = await supabase.from('horses').update({
    red_flag: false,
    red_flag_reason: null,
    red_flag_by: null,
    red_flag_date: null,
  }).eq('id', horseId)

  if (error) throw new Error(error.message)

  revalidatePath(`/horses/${horseId}`)
  revalidatePath('/dashboard')
}

