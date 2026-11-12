// Resumen diario de informes de medicación eliminados, con la razón de cada borrado.
// Lo llama app/api/cron/deleted-medications-summary (Vercel Cron, 5:00 am hora de Puerto Rico).
// Solo envía correo cuando hubo eliminaciones el día anterior.
import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { previousDayInPR, getSummaryRecipients, escapeHtml } from '@/lib/notifications/medication-summary'

const TZ = 'America/Puerto_Rico'

interface DeletionRow {
  id: string
  fecha_tratamiento: string | null
  hora_tratamiento: string | null
  horse_name: string | null
  vet_autorizado_nombre: string | null
  deleted_by_nombre: string | null
  deleted_at: string
  razon: string
  medications: Array<{
    medicamento: string | null
    dosis: number
    dosis_unidad: string | null
  }>
}

// Puerto Rico es UTC-4 todo el año, así que el día PR abarca de 04:00 UTC a 04:00 UTC del día siguiente.
function prDayBoundsUtc(fecha: string): { desde: string; hasta: string } {
  const next = new Date(`${fecha}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return {
    desde: `${fecha}T04:00:00.000Z`,
    hasta: `${next.toISOString().slice(0, 10)}T04:00:00.000Z`,
  }
}

function formatPR(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' })
}

export async function sendDailyDeletedMedicationsSummary(): Promise<{
  fecha: string
  eliminados: number
  destinatarios: number
  enviado: boolean
}> {
  const supabase = createAdminClient()
  const fecha = previousDayInPR()
  const { desde, hasta } = prDayBoundsUtc(fecha)

  const { data, error } = await supabase
    .from('treatment_report_deletions')
    .select('id, fecha_tratamiento, hora_tratamiento, horse_name, vet_autorizado_nombre, deleted_by_nombre, deleted_at, razon, medications')
    .gte('deleted_at', desde)
    .lt('deleted_at', hasta)
    .order('deleted_at', { ascending: true })

  if (error) throw new Error(`Error consultando eliminaciones: ${error.message}`)

  const rows = (data ?? []) as unknown as DeletionRow[]
  if (rows.length === 0) {
    return { fecha, eliminados: 0, destinatarios: 0, enviado: false }
  }

  const recipients = await getSummaryRecipients(supabase, 'notify_medications')
  if (!recipients.length) {
    return { fecha, eliminados: rows.length, destinatarios: 0, enviado: false }
  }

  const headers = ['Fecha tratamiento', 'Hora', 'Caballo', 'Medicamentos', 'Veterinario', 'Eliminado por', 'Hora eliminación', 'Razón']
  const th = (t: string) => `<th style="padding:6px 10px;border:1px solid #ddd;background:#7f1d1d;color:#fff;text-align:left;">${t}</th>`
  const td = (t: string) => `<td style="padding:6px 10px;border:1px solid #ddd;vertical-align:top;">${escapeHtml(t)}</td>`

  const body = rows.map(r => {
    const meds = (r.medications ?? [])
      .map(m => `${m.medicamento ?? 'Medicamento'} ${m.dosis} ${m.dosis_unidad ?? ''}`.trim())
      .join(', ')
    return `<tr>
      ${td(r.fecha_tratamiento ?? '')}
      ${td(r.hora_tratamiento ?? '')}
      ${td(r.horse_name ?? '')}
      ${td(meds || '—')}
      ${td(r.vet_autorizado_nombre ?? '')}
      ${td(r.deleted_by_nombre ?? '')}
      ${td(formatPR(r.deleted_at))}
      ${td(r.razon)}
    </tr>`
  }).join('')

  const subject = `VetTrack - Informes de medicación eliminados del ${fecha} (${rows.length})`
  const html = `
    <h2>Informes de medicación eliminados el ${escapeHtml(fecha)}</h2>
    <p>Se eliminaron ${rows.length} informe${rows.length === 1 ? '' : 's'} de tratamiento. Cada uno incluye la razón indicada por quien lo eliminó.</p>
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;margin:10px 0;">
      <thead><tr>${headers.map(th).join('')}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resend-email`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to: recipients, subject, html }),
  })

  if (!res.ok) throw new Error(`resend-email respondió ${res.status}`)

  return { fecha, eliminados: rows.length, destinatarios: recipients.length, enviado: true }
}
