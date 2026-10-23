// Resumen diario de vacunaciones: un correo con las vacunas aplicadas el día anterior.
// Lo llama app/api/cron/vaccination-summary (Vercel Cron, 5:00 am hora de Puerto Rico).
import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { previousDayInPR, getSummaryRecipients } from '@/lib/notifications/medication-summary'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface SummaryVaccination {
  fecha: string
  notas: string | null
  serial_number: string | null
  vet_name: string | null
  horse: { name: string; microchip: string | null } | null
  vaccine: { name: string } | null
}

export async function sendDailyVaccinationSummary(): Promise<{
  fecha: string
  vacunaciones: number
  destinatarios: number
  enviado: boolean
}> {
  const supabase = createAdminClient()
  const fecha = previousDayInPR()

  const { data, error } = await supabase
    .from('vaccinations')
    .select(`
      fecha, notas, serial_number, vet_name,
      horse:horses(name, microchip),
      vaccine:vaccine_types(name)
    `)
    .eq('fecha', fecha)

  if (error) throw new Error(`Error consultando vacunaciones: ${error.message}`)

  const vacunas = ((data ?? []) as unknown as SummaryVaccination[]).sort((a, b) =>
    (a.horse?.name ?? '').localeCompare(b.horse?.name ?? '')
  )

  const recipients = await getSummaryRecipients(supabase, 'notify_vaccinations')
  if (!recipients.length) {
    return { fecha, vacunaciones: vacunas.length, destinatarios: 0, enviado: false }
  }

  const headers = ['Fecha', 'Caballo', 'Microchip', 'Vacuna', '#Ser', 'Veterinario', 'Notas']
  const th = (t: string) => `<th style="padding:6px 10px;border:1px solid #ddd;background:#2c3e50;color:#fff;text-align:left;">${t}</th>`
  const td = (t: string) => `<td style="padding:6px 10px;border:1px solid #ddd;">${escapeHtml(t)}</td>`

  const rows = vacunas.map(v => `<tr>
    ${td(v.fecha)}
    ${td(v.horse?.name ?? '')}
    ${td(v.horse?.microchip ?? '')}
    ${td(v.vaccine?.name ?? '')}
    ${td(v.serial_number ?? '')}
    ${td(v.vet_name ?? '')}
    ${td(v.notas ?? '')}
  </tr>`).join('')

  const hayDatos = vacunas.length > 0
  const subject = hayDatos
    ? `VetTrack - Resumen de vacunaciones del ${fecha} (${vacunas.length} vacuna${vacunas.length === 1 ? '' : 's'})`
    : `VetTrack - Resumen de vacunaciones del ${fecha}: sin vacunas`

  const body = hayDatos
    ? `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;margin:10px 0;">
         <thead><tr>${headers.map(th).join('')}</tr></thead>
         <tbody>${rows}</tbody>
       </table>`
    : `<p>No hubo vacunaciones registradas el ${escapeHtml(fecha)}.</p>`

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resend-email`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: recipients,
      subject,
      html: `
        <h2>Resumen de vacunaciones del ${escapeHtml(fecha)}</h2>
        ${body}
      `,
    }),
  })

  if (!res.ok) throw new Error(`resend-email respondió ${res.status}`)

  return { fecha, vacunaciones: vacunas.length, destinatarios: recipients.length, enviado: true }
}
