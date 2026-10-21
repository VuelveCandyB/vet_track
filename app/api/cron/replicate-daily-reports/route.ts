import { replicateDailyTreatmentReports } from '@/lib/actions/treatment-reports'

export async function POST(request: Request) {
  try {
    // Validar que la solicitud viene del cron job (usando secret)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await replicateDailyTreatmentReports()

    return Response.json({
      success: true,
      message: `Replicados ${result.replicated} informes de tratamiento`,
      replicated: result.replicated,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error en replicación diaria:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
