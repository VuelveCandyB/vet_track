'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { getVetName } from './shared'

const SUPPORT_EMAILS = ['m.rivera@camareroracepr.com', 'miguelriveracanales@outlook.com']

async function sendSupportEmail(vetName: string, vetEmail: string, situacion: string, detalle: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resend-email`,
      {
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
      }
    )

    if (!response.ok) {
      console.error('Error sending email:', await response.text())
      // No throws — el ticket ya está guardado en BD
    }
  } catch (error) {
    console.error('Failed to send support email:', error)
    // No throws — el ticket ya está guardado en BD
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
