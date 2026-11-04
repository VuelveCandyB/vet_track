'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser, isAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getVetName, getUserFullName } from './shared'
import { logActivity } from './activity-log'

const SUPPORT_EMAILS = ['m.rivera@camareroracepr.com']

async function sendSupportEmail(vetName: string, vetEmail: string, situacion: string, detalle: string) {
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resend-email`
    console.log('[SOS] Calling Edge Function:', url)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: SUPPORT_EMAILS,
        subject: `VetTrack - Ticket de Soporte: ${situacion}`,
        html: `
          <h2>Nuevo ticket de soporte</h2>
          <p><strong>Veterinario:</strong> ${vetName}</p>
          <p><strong>Email:</strong> ${vetEmail}</p>
          <p><strong>Situación:</strong> ${situacion}</p>
          <hr />
          <p><strong>Detalle:</strong></p>
          <p>${detalle.replace(/\n/g, '<br>')}</p>
        `,
      }),
    })

    const responseText = await response.text()
    console.log('[SOS] Response status:', response.status)
    console.log('[SOS] Response body:', responseText)

    if (!response.ok) {
      console.error('[SOS] Email sending failed:', response.status, responseText)
    } else {
      console.log('[SOS] Email sent successfully')
    }
  } catch (error) {
    console.error('[SOS] Failed to call Edge Function:', error)
  }
}

export async function createServiceTicket(formData: FormData) {
  const user = await requireUser()
  const supabase = await createClient()
  const vetName = await getVetName(supabase, user)

  const situacion = formData.get('situacion') as string
  const detalle = formData.get('detalle') as string

  if (!situacion || !detalle) {
    throw new Error('Situación y detalle son requeridos')
  }

  // Insert ticket into DB
  const { data, error } = await supabase.from('service_tickets').insert({
    vet_name: vetName,
    vet_email: user.email,
    situacion,
    detalle,
    created_by: user.id,
  }).select().single()

  if (error) {
    throw new Error(`Error al crear ticket: ${error.message}`)
  }

  // Send email asynchronously (non-blocking)
  sendSupportEmail(vetName, user.email!, situacion, detalle)

  revalidatePath('/horses')
  return { success: true, ticketId: data.id }
}

async function requireTicketAdmin() {
  const user = await requireUser()
  if (!(await isAdmin(user.id, user.email!))) throw new Error('Acceso denegado')
  return user
}

async function sendResolvedEmail(vetEmail: string, situacion: string, notas: string | null) {
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resend-email`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: [vetEmail],
        subject: `VetTrack - Ticket resuelto: ${situacion}`,
        html: `
          <h2>Tu ticket de soporte fue resuelto</h2>
          <p><strong>Situación:</strong> ${situacion}</p>
          ${notas ? `<hr /><p><strong>Qué se hizo:</strong></p><p>${notas.replace(/\n/g, '<br>')}</p>` : ''}
        `,
      }),
    })

    if (!response.ok) {
      console.error('[SOS] Resolved email failed:', response.status, await response.text())
    }
  } catch (error) {
    console.error('[SOS] Failed to send resolved email:', error)
  }
}

// Marca el ticket como resuelto y guarda las notas de lo que se hizo.
export async function resolveServiceTicket(id: string, notas: string) {
  const user = await requireTicketAdmin()
  const supabase = await createClient()
  const nombre = await getUserFullName(supabase, user)
  const admin = createAdminClient()

  const { data: previo } = await admin
    .from('service_tickets')
    .select('status, vet_email, situacion')
    .eq('id', id)
    .single()

  const { error } = await admin
    .from('service_tickets')
    .update({
      status: 'resuelto',
      notas: notas.trim() || null,
      resuelto_por: user.id,
      resuelto_por_nombre: nombre,
      resuelto_en: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(`Error al resolver ticket: ${error.message}`)

  await logActivity({
    user,
    action: 'service_ticket.resolve',
    entityType: 'service_ticket',
    entityId: id,
    description: `Resolvió ticket SOS${notas.trim() ? `: ${notas.trim()}` : ''}`,
  })

  // Solo avisa la primera vez que pasa a resuelto, no al editar las notas después.
  if (previo?.status !== 'resuelto' && previo?.vet_email) {
    await sendResolvedEmail(previo.vet_email, previo.situacion, notas.trim() || null)
  }

  revalidatePath('/admin/tickets')
}

// Vuelve a pendiente y limpia los datos de resolución (conserva las notas).
export async function reopenServiceTicket(id: string) {
  const user = await requireTicketAdmin()

  const { error } = await createAdminClient()
    .from('service_tickets')
    .update({
      status: 'pendiente',
      resuelto_por: null,
      resuelto_por_nombre: null,
      resuelto_en: null,
    })
    .eq('id', id)

  if (error) throw new Error(`Error al reabrir ticket: ${error.message}`)

  await logActivity({
    user,
    action: 'service_ticket.reopen',
    entityType: 'service_ticket',
    entityId: id,
    description: 'Reabrió ticket SOS',
  })

  revalidatePath('/admin/tickets')
}
