import { sendDailyMedicationSummary } from '@/lib/notifications/medication-summary'

// Vercel Cron llama este endpoint todos los días a las 9:00 UTC (5:00 am en Puerto Rico).
// Vercel envía "Authorization: Bearer <CRON_SECRET>".
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sendDailyMedicationSummary()
    return Response.json({ success: true, ...result })
  } catch (error) {
    console.error('[MedicationSummary] Error:', error)
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
