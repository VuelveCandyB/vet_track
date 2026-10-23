// Resumen diario de medicación: un correo con todos los tratamientos del día anterior.
// Lo llama app/api/cron/medication-summary (Vercel Cron, 5:00 am hora de Puerto Rico).
import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

const TZ = 'America/Puerto_Rico'

// Fecha de ayer en Puerto Rico, formato YYYY-MM-DD.
export function previousDayInPR(now: Date = new Date()): string {
  const hoy = now.toLocaleDateString('en-CA', { timeZone: TZ }) // "2026-10-22"
  const d = new Date(`${hoy}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface SummaryReport {
  fecha_tratamiento: string
  hora_tratamiento: string | null
  establo: string | null
  diagnostico: string | null
  vet_autorizado_nombre: string | null
  numero_identificacion_caballo: string | null
  horse: { name: string; microchip: string | null; registration: string | null } | null
  medications: Array<{
    dosis: number
    dosis_unidad: string | null
    tiempo_restriccion: number | null
    drug: { nombre: string; nombre_comercial: string | null } | null
  }>
}

// Destinatarios de un resumen: usuarios con la casilla indicada (Admin → Usuarios)
// más la lista fija RESUMEN_MEDICACION_EMAILS.
export async function getSummaryRecipients(
  supabase: ReturnType<typeof createAdminClient>,
  flag: 'notify_medications' | 'notify_vaccinations'
): Promise<string[]> {
  const emails = new Set<string>()

  const { data: profiles } = await supabase.from('profiles').select('id').eq(flag, true)
  if (profiles?.length) {
    const { data: authUsers } = await supabase.rpc('list_auth_users')
    const ids = new Set(profiles.map(p => p.id))
    for (const u of (authUsers ?? []) as Array<{ id: string; email: string }>) {
      if (ids.has(u.id) && u.email) emails.add(u.email.toLowerCase())
    }
  }

  // Correos fijos adicionales, separados por coma (variable de entorno en Vercel)
  for (const e of (process.env.RESUMEN_MEDICACION_EMAILS ?? '').split(',')) {
    const clean = e.trim().toLowerCase()
    if (clean) emails.add(clean)
  }

  return [...emails]
}

export async function sendDailyMedicationSummary(): Promise<{
  fecha: string
  tratamientos: number
  destinatarios: number
  enviado: boolean
}> {
  const supabase = createAdminClient()
  const fecha = previousDayInPR()

  const { data, error } = await supabase
    .from('treatment_reports')
    .select(`
      fecha_tratamiento, hora_tratamiento, establo, diagnostico, vet_autorizado_nombre,
      numero_identificacion_caballo,
      horse:horses(name, microchip, registration),
      medications:treatment_report_medications(dosis, dosis_unidad, tiempo_restriccion, drug:drugs(nombre, nombre_comercial))
    `)
    .eq('fecha_tratamiento', fecha)
    .order('hora_tratamiento', { ascending: true })

  if (error) throw new Error(`Error consultando informes: ${error.message}`)

  const reports = ((data ?? []) as unknown as SummaryReport[]).sort((a, b) =>
    (a.horse?.name ?? '').localeCompare(b.horse?.name ?? '')
  )

  const recipients = await getSummaryRecipients(supabase, 'notify_medications')
  if (!recipients.length) {
    return { fecha, tratamientos: reports.length, destinatarios: 0, enviado: false }
  }

  const headers = ['Fecha', 'Hora', 'Caballo', 'Microchip', 'Establo', 'Diagnóstico', 'Medicamento', 'Dosis', 'Restricción (h)', 'Veterinario']
  const th = (t: string) => `<th style="padding:6px 10px;border:1px solid #ddd;background:#2c3e50;color:#fff;text-align:left;">${t}</th>`
  const td = (t: string) => `<td style="padding:6px 10px;border:1px solid #ddd;">${escapeHtml(t)}</td>`

  const rows = reports.flatMap(r => r.medications.map(m => {
    const drugName = m.drug
      ? `${m.drug.nombre}${m.drug.nombre_comercial ? ` (${m.drug.nombre_comercial})` : ''}`
      : 'Medicamento'
    return `<tr>
      ${td(r.fecha_tratamiento)}
      ${td(r.hora_tratamiento ?? '')}
      ${td(r.horse?.name ?? '')}
      ${td(r.horse?.microchip ?? '')}
      ${td(r.establo ?? '')}
      ${td(r.diagnostico ?? '')}
      ${td(drugName)}
      ${td(`${m.dosis} ${m.dosis_unidad ?? ''}`.trim())}
      ${td(m.tiempo_restriccion ? String(m.tiempo_restriccion) : 'N/A')}
      ${td(r.vet_autorizado_nombre ?? '')}
    </tr>`
  })).join('')

  const hayDatos = reports.length > 0
  const subject = hayDatos
    ? `VetTrack - Resumen de medicación del ${fecha} (${reports.length} tratamiento${reports.length === 1 ? '' : 's'})`
    : `VetTrack - Resumen de medicación del ${fecha}: sin tratamientos`

  const body = hayDatos
    ? `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;margin:10px 0;">
         <thead><tr>${headers.map(th).join('')}</tr></thead>
         <tbody>${rows}</tbody>
       </table>`
    : `<p>No hubo tratamientos registrados el ${escapeHtml(fecha)}.</p>`

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
        <h2>Resumen de medicación del ${escapeHtml(fecha)}</h2>
        ${body}
      `,
    }),
  })

  if (!res.ok) throw new Error(`resend-email respondió ${res.status}`)

  return { fecha, tratamientos: reports.length, destinatarios: recipients.length, enviado: true }
}
