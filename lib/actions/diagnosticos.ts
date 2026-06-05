'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
const MAX_SIZE = 10 * 1024 * 1024

async function uploadAttachment(supabase: any, horseId: string, file: File, prefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null
  if (file.size > MAX_SIZE || !ALLOWED_TYPES.has(file.type)) return null
  try {
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin'
    const { randomUUID } = await import('crypto')
    const path = `diagnosticos/${horseId}/${prefix}_${randomUUID()}.${ext}`
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

export async function createDiagnostico(horseId: string, formData: FormData) {
  try {
    const user = await requireUser()
    const supabase = await createClient()
    const vetName = await getVetName(supabase, user)

    const file = formData.get('attachment') as File | null
    const attachmentUrl = file ? await uploadAttachment(supabase, horseId, file, 'diag') : null

    const { error } = await supabase.from('diagnosticos').insert({
      horse_id: horseId,
      vet_name: vetName,
      created_by: user.id,
      fecha: formData.get('fecha'),
      tipo: formData.get('tipo'),
      diagnostico: formData.get('diagnostico'),
      sistema_afectado: (formData.get('sistema_afectado') as string) || null,
      severidad: (formData.get('severidad') as string) || null,
      tratamiento_recomendado: (formData.get('tratamiento_recomendado') as string) || null,
      notas: (formData.get('notas') as string) || null,
      recomendar_vetlist: formData.get('recomendar_vetlist') === 'on',
      attachment_url: attachmentUrl,
    })

    if (error) throw error

    revalidatePath(`/horses/${horseId}`)
  } catch (err) {
    console.error('Error creating diagnostico:', err)
    throw err
  }
}
