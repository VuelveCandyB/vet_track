'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser, canRegisterEuthanasia } from '@/lib/auth'
import { getVetName } from './shared'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
const MAX_SIZE = 10 * 1024 * 1024

export async function createEuthanasia(horseId: string, formData: FormData) {
  const user = await requireUser()
  const allowed = await canRegisterEuthanasia(user.id, user.email!)
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

  await supabase.from('euthanasia').insert({
    horse_id:                horseId,
    vet_name:                vetName,
    fecha:                   formData.get('fecha'),
    fecha_ultima_carrera:    (formData.get('fecha_ultima_carrera') as string) || null,
    motivo:                  formData.get('motivo'),
    propietario_notificado:  formData.get('propietario_notificado') === 'on',
    attachment_url:          attachmentUrl,
  })

  await supabase.from('horses').update({ status: 'deceased' }).eq('id', horseId)

  revalidatePath(`/horses/${horseId}`)
}
