'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser, can } from '@/lib/auth'
import { getUserFullName } from './shared'
import { logActivity } from './activity-log'

export async function getVaccinationPdfUrl(vaccinationId: string, pdfPath: string) {
  const user = await requireUser()
  const supabase = await createClient()

  // Verify user can access this vaccination
  const { data: vac } = await supabase
    .from('vaccinations')
    .select('horse_id')
    .eq('id', vaccinationId)
    .single()

  if (!vac) throw new Error('Vacunación no encontrada')

  // Generate signed URL (valid for 1 hour)
  const { data, error } = await supabase.storage
    .from('vaccinations')
    .createSignedUrl(pdfPath, 3600)

  if (error) throw new Error(`Error al generar enlace: ${error.message}`)
  return data.signedUrl
}

type SentVaccination = { fecha: string; vaccineName: string; serial: string | null }

async function sendVaccinationEmail(supabase: any, horseName: string, items: SentVaccination[], microchip: string | null | undefined) {
  try {
    const { data: recipients } = await supabase
      .from('profiles')
      .select('id')
      .eq('notify_vaccinations', true)

    if (!recipients?.length) return

    const { data: authUsers } = await supabase.rpc('list_auth_users')
    const idSet = new Set(recipients.map((r: any) => r.id))
    const emails = (authUsers ?? [])
      .filter((u: any) => idSet.has(u.id))
      .map((u: any) => u.email)
      .filter(Boolean)

    if (!emails.length) return

    const subject = items.length === 1
      ? `VetTrack - Vacunación registrada: ${horseName} (${items[0].vaccineName})`
      : `VetTrack - ${items.length} vacunaciones registradas: ${horseName}`

    const rows = items.map(i => `<li><strong>${i.vaccineName}</strong> - ${i.fecha}${i.serial ? ` (#Ser ${i.serial})` : ''}</li>`).join('')

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resend-email`
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: emails,
        subject,
        html: `
          <h2>${items.length === 1 ? 'Nueva vacunación registrada' : 'Nuevas vacunaciones registradas'}</h2>
          <p><strong>Caballo:</strong> ${horseName}</p>
          <p><strong>Microchip:</strong> ${microchip || 'N/A'}</p>
          <ul>${rows}</ul>
        `,
      }),
    })
  } catch (error) {
    console.error('[Vaccination] Failed to send notification email:', error)
  }
}

export async function createVaccinations(horseId: string, formData: FormData) {
  const user = await requireUser()
  const allowed = await can(user, 'horses.vaccination_modal', 'full')
  if (!allowed) throw new Error('Acceso denegado')
  const supabase = await createClient()
  const vetName = await getUserFullName(supabase, user)
  const fecha = formData.get('fecha') as string
  const pdfFile = formData.get('pdf') as File | null

  if (!fecha || isNaN(new Date(fecha).getTime())) throw new Error('Fecha de vacunación inválida')

  // Parse the rows sent by the modal
  let rows: { vaccine_type_id: string; serial_number?: string; notas?: string; fecha_override?: string }[]
  try {
    rows = JSON.parse((formData.get('vaccinations') as string) || '[]')
  } catch {
    throw new Error('Datos de vacunas inválidos')
  }
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('Agrega al menos una vacuna')

  const typeIds = rows.map(r => r.vaccine_type_id)
  if (typeIds.some(id => !id)) throw new Error('Tipo de vacuna requerido')
  if (new Set(typeIds).size !== typeIds.length) throw new Error('No puedes repetir la misma vacuna en un mismo registro')

  for (const r of rows) {
    if (r.serial_number && !/^[A-Za-z0-9]{0,10}$/.test(r.serial_number)) {
      throw new Error('El #Ser debe tener máximo 10 caracteres alfanuméricos')
    }
    if (r.fecha_override && isNaN(new Date(r.fecha_override).getTime())) {
      throw new Error('Fecha de vacunación inválida')
    }
  }

  // Fetch all vaccine types in one query
  const { data: vaccineTypes, error: vaccineError } = await supabase
    .from('vaccine_types')
    .select('id, name, validity_days')
    .in('id', typeIds)

  if (vaccineError) throw vaccineError
  const typeById = new Map((vaccineTypes ?? []).map(v => [v.id, v]))
  if (typeIds.some(id => !typeById.has(id))) throw new Error('Tipo de vacuna no encontrado')

  // Validate every row BEFORE writing anything (todo o nada)
  for (const r of rows) {
    const vt = typeById.get(r.vaccine_type_id)!
    const fechaRow = r.fecha_override || fecha

    const { data: lastVaccination } = await supabase
      .from('vaccinations')
      .select('fecha')
      .eq('horse_id', horseId)
      .eq('vaccine_type_id', r.vaccine_type_id)
      .order('fecha', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastVaccination) {
      const last = new Date(lastVaccination.fecha)
      const next = new Date(last)
      next.setDate(next.getDate() + vt.validity_days)
      if (new Date(fechaRow) < next) {
        throw new Error(
          `Ya existe un registro de "${vt.name}" el ${lastVaccination.fecha}. La próxima aplicación no puede registrarse antes del ${next.toISOString().split('T')[0]}.`
        )
      }
    }
  }

  const { data: horse } = await supabase
    .from('horses')
    .select('name, microchip')
    .eq('id', horseId)
    .single()

  // Upload the shared PDF once
  let pdfPath: string | null = null
  let pdfName: string | null = null
  if (pdfFile && pdfFile.size > 0) {
    if (pdfFile.type !== 'application/pdf') {
      throw new Error('El archivo debe ser un PDF válido')
    }
    if (pdfFile.size > 5 * 1024 * 1024) {
      throw new Error('El PDF no debe superar 5MB')
    }

    const fileName = `${horseId}/${Date.now()}-${pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const arrayBuffer = await pdfFile.arrayBuffer()
    const { data, error: uploadError } = await supabase.storage
      .from('vaccinations')
      .upload(fileName, new Uint8Array(arrayBuffer), {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) throw new Error(`Error al subir PDF: ${uploadError.message}`)
    pdfPath = data.path
    pdfName = pdfFile.name
  }

  // One insert for all rows
  const payload = rows.map(r => ({
    horse_id:        horseId,
    vaccine_type_id: r.vaccine_type_id,
    vet_name:        vetName,
    fecha:           r.fecha_override || fecha,
    notas:           r.notas || null,
    serial_number:   r.serial_number || null,
    pdf_path:        pdfPath,
    pdf_name:        pdfName,
    created_by:      user.id,
  }))

  const { data: inserted, error } = await supabase
    .from('vaccinations')
    .insert(payload)
    .select('id, vaccine_type_id, fecha')

  if (error) {
    if (pdfPath) await supabase.storage.from('vaccinations').remove([pdfPath])
    throw error
  }

  const sent: SentVaccination[] = (inserted ?? []).map(v => ({
    fecha: v.fecha,
    vaccineName: typeById.get(v.vaccine_type_id)?.name ?? '',
    serial: rows.find(r => r.vaccine_type_id === v.vaccine_type_id)?.serial_number || null,
  }))

  sendVaccinationEmail(supabase, horse?.name ?? 'Caballo', sent, horse?.microchip)

  for (const v of inserted ?? []) {
    await logActivity({
      user,
      action: 'vaccination.create',
      entityType: 'vaccination',
      entityId: v.id,
      horseId,
      description: `Registró vacunación: ${typeById.get(v.vaccine_type_id)?.name} el ${v.fecha}`,
    })
  }

  revalidatePath(`/horses/${horseId}`)
}
