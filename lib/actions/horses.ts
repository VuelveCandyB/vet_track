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

  let archivoUrl: string | null = null

  // Handle file upload if present
  const archivo = formData.get('archivo') as File | null
  if (archivo) {
    try {
      const fileName = `${horseId}/${Date.now()}-${archivo.name}`
      const arrayBuffer = await archivo.arrayBuffer()

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('referidos')
        .upload(fileName, new Uint8Array(arrayBuffer), {
          upsert: false,
          contentType: archivo.type
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw new Error(`Error subiendo archivo: ${uploadError.message}`)
      }

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('referidos')
        .getPublicUrl(fileName)

      archivoUrl = publicUrl.publicUrl
    } catch (fileError: any) {
      console.error('File upload exception:', fileError)
      throw fileError
    }
  }

  // Update horse red_flag state
  const { error: updateError } = await supabase.from('horses').update({
    red_flag: true,
    red_flag_reason: reason,
    red_flag_by: vetName,
    red_flag_date: new Date().toISOString(),
  }).eq('id', horseId)

  if (updateError) throw new Error(updateError.message)

  // Record in horse_referidos history with new clinical fields
  const diasRecomendacion = formData.get('dias_recomendacion') as string
  const { error: historyError } = await supabase.from('horse_referidos').insert({
    horse_id: horseId,
    motivo: reason,
    marcado_por: vetName,
    fecha_marcado: new Date().toISOString(),
    created_by: user.id,
    dias_recomendacion: diasRecomendacion ? parseInt(diasRecomendacion) : null,
    extremidad:          (formData.get('extremidad') as string) || null,
    grado:               (formData.get('grado') as string) || null,
    elegible_trabajar:   formData.get('elegible_trabajar') === 'on',
    requiere_pruebas:    formData.get('requiere_pruebas') === 'on',
    reclamo_anulado:     formData.get('reclamo_anulado') === 'on',
    persona_responsable: (formData.get('persona_responsable') as string) || null,
    tipo_contacto:       (formData.get('tipo_contacto') as string) || null,
    contacto:            (formData.get('contacto') as string) || null,
    archivo_url:         archivoUrl,
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

export async function addAlternateMicrochip(horseId: string, formData: FormData) {
  const user = await requireUser()
  const allowed = await can(user, 'horses.microchip_alternate', 'full')
  if (!allowed) throw new Error('Acceso denegado')

  const supabase = await createClient()
  const microchip = (formData.get('microchip') as string || '').trim()

  if (!microchip) throw new Error('El microchip es obligatorio')

  const { error } = await supabase.from('horse_alternate_microchips').insert({
    horse_id: horseId,
    microchip,
    created_by: user.id,
  })

  if (error) throw new Error(error.message)

  // Log activity
  await logActivity({
    user,
    action: 'horse.alternate_microchip_add',
    entityType: 'horse',
    entityId: horseId,
    horseId,
    description: `Agregó microchip alterno: ${microchip}`,
  })

  revalidatePath(`/horses/${horseId}`)
  revalidatePath('/horses')
}

export async function deleteAlternateMicrochip(id: string, horseId: string) {
  const user = await requireUser()
  const allowed = await can(user, 'horses.microchip_alternate', 'full')
  if (!allowed) throw new Error('Acceso denegado')

  const supabase = await createClient()

  // Get the microchip value before deleting (for logging)
  const { data: altMicrochip } = await supabase
    .from('horse_alternate_microchips')
    .select('microchip')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('horse_alternate_microchips').delete().eq('id', id)

  if (error) throw new Error(error.message)

  // Log activity
  if (altMicrochip) {
    await logActivity({
      user,
      action: 'horse.alternate_microchip_delete',
      entityType: 'horse',
      entityId: horseId,
      horseId,
      description: `Eliminó microchip alterno: ${altMicrochip.microchip}`,
    })
  }

  revalidatePath(`/horses/${horseId}`)
  revalidatePath('/horses')
}

