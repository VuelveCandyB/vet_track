'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser, can } from '@/lib/auth'
import { getVetName, resetHorseRedFlagCache } from './shared'
import { logActivity } from './activity-log'

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

  // Log activity
  await logActivity({
    user,
    action: 'horse.create',
    entityType: 'horse',
    entityId: data.id,
    horseId: data.id,
    description: `Creó caballo: ${payload.name}`,
  })

  redirect(`/horses/${data.id}`)
}

export async function setRedFlag(horseId: string, formData: FormData) {
  const user = await requireUser()
  const supabase = await createClient()
  const vetName = await getVetName(supabase, user)
  const reason = (formData.get('reason') as string || '').trim()

  if (!reason) throw new Error('El motivo es obligatorio')

  // Update horse red_flag state
  const { error: updateError } = await supabase.from('horses').update({
    red_flag: true,
    red_flag_reason: reason,
    red_flag_by: vetName,
    red_flag_date: new Date().toISOString(),
  }).eq('id', horseId)

  if (updateError) throw new Error(updateError.message)

  // Record in horse_referidos history with new clinical fields
  const { error: historyError } = await supabase.from('horse_referidos').insert({
    horse_id: horseId,
    motivo: reason,
    marcado_por: vetName,
    fecha_marcado: new Date().toISOString(),
    created_by: user.id,
    extremidad:          (formData.get('extremidad') as string) || null,
    grado:               (formData.get('grado') as string) || null,
    elegible_trabajar:   formData.get('elegible_trabajar') === 'on',
    requiere_pruebas:    formData.get('requiere_pruebas') === 'on',
    reclamo_anulado:     formData.get('reclamo_anulado') === 'on',
    persona_responsable: (formData.get('persona_responsable') as string) || null,
    tipo_contacto:       (formData.get('tipo_contacto') as string) || null,
    contacto:            (formData.get('contacto') as string) || null,
  })

  if (historyError) throw new Error(historyError.message)

  revalidatePath(`/horses/${horseId}`)
  revalidatePath('/dashboard')
}

export async function clearRedFlag(horseId: string) {
  await requireUser()
  const supabase = await createClient()

  // Update horse red_flag state using the shared helper
  await resetHorseRedFlagCache(supabase, horseId)

  // Mark the latest referido as resolved
  const { data: latestReferido, error: fetchError } = await supabase
    .from('horse_referidos')
    .select('id')
    .eq('horse_id', horseId)
    .is('fecha_resuelto', null)
    .is('vetlist_id', null)
    .order('fecha_marcado', { ascending: false })
    .limit(1)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') throw new Error(fetchError.message) // PGRST116 = no rows

  if (latestReferido) {
    const { error: historyError } = await supabase
      .from('horse_referidos')
      .update({ fecha_resuelto: new Date().toISOString() })
      .eq('id', latestReferido.id)

    if (historyError) throw new Error(historyError.message)
  }

  revalidatePath(`/horses/${horseId}`)
  revalidatePath('/dashboard')
}

