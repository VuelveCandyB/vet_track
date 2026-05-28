'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser, isAdmin } from '@/lib/auth'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
const MAX_SIZE = 10 * 1024 * 1024

async function uploadAttachment(supabase: any, horseId: string, file: File, prefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null
  if (file.size > MAX_SIZE || !ALLOWED_TYPES.has(file.type)) return null
  try {
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin'
    const { randomUUID } = await import('crypto')
    const path = `${horseId}/${prefix}_${randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await supabase.storage.from('med-attachments').upload(path, buffer, {
      contentType: file.type, upsert: false,
    })
    const { data } = supabase.storage.from('med-attachments').getPublicUrl(path)
    return data.publicUrl
  } catch { return null }
}

async function getVetName(supabase: any, user: any): Promise<string> {
  try {
    const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single()
    if (data) {
      const full = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim()
      if (full) return full
    }
  } catch {}
  return user.email
}

export async function createMedication(horseId: string, formData: FormData) {
  const user = await requireUser()
  const supabase = await createClient()
  const vetName = await getVetName(supabase, user)

  const file = formData.get('attachment') as File | null
  const attachmentUrl = file ? await uploadAttachment(supabase, horseId, file, 'med') : null

  const detHoras = formData.get('detection_time_horas') as string
  const wdHoras  = formData.get('withdrawal_time_horas') as string

  await supabase.from('medications').insert({
    horse_id:              horseId,
    vet_name:              vetName,
    type:                  formData.get('type'),
    drug:                  formData.get('drug'),
    dose:                  formData.get('dose'),
    quantity:              (formData.get('quantity') as string) || null,
    notes:                 (formData.get('notes') as string) || null,
    administered_at:       formData.get('administered_at'),
    attachment_url:        attachmentUrl,
    drug_categoria:        (formData.get('drug_categoria') as string) || null,
    detection_time_horas:  detHoras ? parseInt(detHoras) : null,
    withdrawal_time_horas: wdHoras  ? parseInt(wdHoras)  : null,
    tipo_restriccion:      (formData.get('tipo_restriccion') as string) || null,
    drug_notas:            (formData.get('drug_notas') as string) || null,
    created_by:            user.id,
  })

  revalidatePath(`/horses/${horseId}`)
}

export async function deleteMedication(horseId: string, medId: string) {
  const user = await requireUser()
  if (!isAdmin(user.email!)) throw new Error('Acceso denegado')
  const supabase = await createClient()
  await supabase.from('medications').delete().eq('id', medId)
  revalidatePath(`/horses/${horseId}`)
}
