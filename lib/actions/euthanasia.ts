'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser, can } from '@/lib/auth'
import { getVetName } from './shared'
import { logActivity } from './activity-log'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
const MAX_SIZE = 10 * 1024 * 1024

export async function createEuthanasia(horseId: string, formData: FormData) {
  const user = await requireUser()
  const allowed = await can(user, 'horses.euthanasia_modal', 'special')
  if (!allowed) throw new Error('Acceso denegado')

  const supabase = await createClient()
  const vetName = await getVetName(supabase, user)

  let attachmentUrl: string | null = null
  const file = formData.get('attachment') as File | null
  if (file && file.size > 0 && file.size <= MAX_SIZE && ALLOWED_TYPES.has(file.type)) {
    try {
      const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin'
      const { randomUUID } = await import('crypto')
      const path = `euthanasia/${horseId}/${randomUUID()}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      await supabase.storage.from('med-attachments').upload(path, buffer, {
        contentType: file.type, upsert: false,
      })
      const { data } = supabase.storage.from('med-attachments').getPublicUrl(path)
      attachmentUrl = data.publicUrl
    } catch {}
  }

  const { data: euthanasiaRecord, error } = await supabase.from('euthanasia').insert({
    horse_id:                horseId,
    vet_name:                vetName,
    fecha:                   formData.get('fecha'),
    fecha_ultima_carrera:    (formData.get('fecha_ultima_carrera') as string) || null,
    motivo:                  formData.get('motivo'),
    propietario_notificado:  formData.get('propietario_notificado') === 'on',
    attachment_url:          attachmentUrl,
  }).select('id').single()

  if (error) throw error

  await supabase.from('horses').update({ status: 'deceased' }).eq('id', horseId)

  // Log activity
  await logActivity({
    user,
    action: 'euthanasia.create',
    entityType: 'euthanasia',
    entityId: euthanasiaRecord?.id,
    horseId,
    description: `Registró eutanasia: ${formData.get('motivo') || 'sin motivo especificado'}`,
  })

  revalidatePath(`/horses/${horseId}`)
}
