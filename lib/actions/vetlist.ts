'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser, can } from '@/lib/auth'
import { getVetName } from './shared'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
const MAX_SIZE = 10 * 1024 * 1024

async function uploadAttachment(supabase: any, horseId: string, file: File, prefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null
  if (file.size > MAX_SIZE || !ALLOWED_TYPES.has(file.type)) return null
  try {
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin'
    const { randomUUID } = await import('crypto')
    const path = `vetlist/${horseId}/${prefix}_${randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await supabase.storage.from('med-attachments').upload(path, buffer, {
      contentType: file.type, upsert: false,
    })
    const { data } = supabase.storage.from('med-attachments').getPublicUrl(path)
    return data.publicUrl
  } catch { return null }
}

export async function createVetlistEntry(horseId: string, formData: FormData) {
  const user = await requireUser()
  const allowed = await can(user, 'horses.vetlist_modal', 'full')
  if (!allowed) throw new Error('Acceso denegado')
  const supabase = await createClient()
  const vetName = await getVetName(supabase, user)

  const file = formData.get('attachment') as File | null
  const attachmentUrl = file ? await uploadAttachment(supabase, horseId, file, 'ingreso') : null

  await Promise.all([
    supabase.from('vetlist').insert({
      horse_id:               horseId,
      motivo:                 formData.get('motivo'),
      descripcion:            (formData.get('descripcion') as string) || null,
      fecha_ingreso:          formData.get('fecha_ingreso'),
      fecha_inicio_descanso:  (formData.get('fecha_inicio_descanso') as string) || null,
      fecha_fin_descanso:     (formData.get('fecha_fin_descanso') as string) || null,
      vet_ingreso:            vetName,
      attachment_ingreso_url: attachmentUrl,
      created_by:             user.id,
    }),
    supabase.from('horses').update({ status: 'injury' }).eq('id', horseId),
  ])

  revalidatePath(`/horses/${horseId}`)
}

export async function releaseVetlistEntry(horseId: string, entryId: string, formData: FormData) {
  const user = await requireUser()
  const allowed = await can(user, 'horses.vetlist_release', 'full')
  if (!allowed) throw new Error('Acceso denegado')
  const supabase = await createClient()
  const vetName = await getVetName(supabase, user)

  const file = formData.get('attachment') as File | null
  const attachmentUrl = file ? await uploadAttachment(supabase, horseId, file, 'egreso') : null

  await Promise.all([
    supabase.from('vetlist').update({
      fecha_egreso:          formData.get('fecha_egreso'),
      vet_egreso:            vetName,
      resultado_examen:      (formData.get('resultado_examen') as string) || null,
      condiciones_post:      (formData.get('condiciones_post') as string) || null,
      attachment_egreso_url: attachmentUrl,
    }).eq('id', entryId),
    supabase.from('horses').update({ status: 'active' }).eq('id', horseId),
  ])

  revalidatePath(`/horses/${horseId}`)
}
