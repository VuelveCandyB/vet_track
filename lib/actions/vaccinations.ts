'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser, can } from '@/lib/auth'
import { getVetName } from './shared'

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

async function sendVaccinationEmail(supabase: any, horseName: string, fecha: string, vaccineName: string, microchip: string | null | undefined) {
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

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resend-email`
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: emails,
        subject: `VetTrack - Vacunación registrada: ${horseName} (${vaccineName})`,
        html: `
          <h2>Nueva vacunación registrada</h2>
          <p><strong>Caballo:</strong> ${horseName}</p>
          <p><strong>Vacuna:</strong> ${vaccineName}</p>
          <p><strong>Fecha de vacunación:</strong> ${fecha}</p>
          <p><strong>Microchip:</strong> ${microchip || 'N/A'}</p>
        `,
      }),
    })
  } catch (error) {
    console.error('[Vaccination] Failed to send notification email:', error)
  }
}

export async function createVaccination(horseId: string, formData: FormData) {
  const user = await requireUser()
  const allowed = await can(user, 'horses.vaccination_modal', 'full')
  if (!allowed) throw new Error('Acceso denegado')
  const supabase = await createClient()
  const vetName = await getVetName(supabase, user)
  const fecha = formData.get('fecha') as string
  const vaccineTypeId = formData.get('vaccine_type_id') as string
  const pdfFile = formData.get('pdf') as File | null

  if (!vaccineTypeId) throw new Error('Tipo de vacuna requerido')

  // Fetch vaccine type to get validity_days and name
  const { data: vaccineType, error: vaccineError } = await supabase
    .from('vaccine_types')
    .select('name, validity_days')
    .eq('id', vaccineTypeId)
    .single()

  if (vaccineError || !vaccineType) throw new Error('Tipo de vacuna no encontrado')

  // Check if this specific vaccine has been given recently (per-vaccine blocking)
  const { data: lastVaccination } = await supabase
    .from('vaccinations')
    .select('fecha')
    .eq('horse_id', horseId)
    .eq('vaccine_type_id', vaccineTypeId)
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastVaccination) {
    const last = new Date(lastVaccination.fecha)
    const next = new Date(last)
    next.setDate(next.getDate() + vaccineType.validity_days)
    if (new Date(fecha) < next) {
      throw new Error(
        `Ya existe un registro de "${vaccineType.name}" el ${lastVaccination.fecha}. La próxima aplicación no puede registrarse antes del ${next.toISOString().split('T')[0]}.`
      )
    }
  }

  const { data: horse } = await supabase
    .from('horses')
    .select('name, microchip')
    .eq('id', horseId)
    .single()

  // Handle PDF upload if provided
  let pdfPath = null
  let pdfName = null
  if (pdfFile && pdfFile.size > 0) {
    // Validate PDF file
    if (pdfFile.type !== 'application/pdf') {
      throw new Error('El archivo debe ser un PDF válido')
    }
    if (pdfFile.size > 5 * 1024 * 1024) {
      throw new Error('El PDF no debe superar 5MB')
    }

    // Upload to Supabase Storage
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

  const { error } = await supabase.from('vaccinations').insert({
    horse_id:       horseId,
    vaccine_type_id: vaccineTypeId,
    vet_name:       vetName,
    fecha,
    notas:          (formData.get('notas') as string) || null,
    serial_number:  (formData.get('serial_number') as string) || null,
    pdf_path:       pdfPath,
    pdf_name:       pdfName,
    created_by:     user.id,
  })

  if (error) throw error

  sendVaccinationEmail(supabase, horse?.name ?? 'Caballo', fecha, vaccineType.name, horse?.microchip)

  revalidatePath(`/horses/${horseId}`)
}
