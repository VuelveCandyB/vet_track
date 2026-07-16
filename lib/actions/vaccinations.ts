'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser, can } from '@/lib/auth'
import { getVetName } from './shared'

const MIN_DAYS_BETWEEN_VACCINATIONS = 365

async function sendVaccinationEmail(supabase: any, horseName: string, fecha: string, microchip: string | null | undefined) {
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
        subject: `VetTrack - Vacunación registrada: ${horseName}`,
        html: `
          <h2>Nueva vacunación registrada</h2>
          <p><strong>Caballo:</strong> ${horseName}</p>
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

  // Regla anual: bloquear si la última vacunación fue hace menos de 1 año
  const { data: lastVaccination } = await supabase
    .from('vaccinations')
    .select('fecha')
    .eq('horse_id', horseId)
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastVaccination) {
    const last = new Date(lastVaccination.fecha)
    const next = new Date(last)
    next.setDate(next.getDate() + MIN_DAYS_BETWEEN_VACCINATIONS)
    if (new Date(fecha) < next) {
      throw new Error(
        `Ya existe una vacunación registrada el ${lastVaccination.fecha}. La próxima vacunación no puede registrarse antes del ${next.toISOString().split('T')[0]}.`
      )
    }
  }

  const { data: horse } = await supabase
    .from('horses')
    .select('name, microchip')
    .eq('id', horseId)
    .single()

  const { error } = await supabase.from('vaccinations').insert({
    horse_id:   horseId,
    vet_name:   vetName,
    fecha,
    notas:      (formData.get('notas') as string) || null,
    created_by: user.id,
  })

  if (error) throw error

  sendVaccinationEmail(supabase, horse?.name ?? 'Caballo', fecha, horse?.microchip)

  revalidatePath(`/horses/${horseId}`)
}
