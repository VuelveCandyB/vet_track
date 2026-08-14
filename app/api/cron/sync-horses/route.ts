import { processSyncBatch } from '@/lib/actions/sync'

export async function POST(request: Request) {
  try {
    // Validar que la solicitud viene del cron job (usando secret)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[CRON] Starting horse sync run...')
    const startTime = Date.now()

    // Process batches until completed or timeout (~14 minutes to stay under 15min Vercel limit)
    const maxDurationMs = 14 * 60 * 1000
    let lastResult = null

    while (Date.now() - startTime < maxDurationMs) {
      lastResult = await processSyncBatch(15)
      console.log(`[CRON] Batch completed: page ${lastResult.currentPage}/${lastResult.totalPages}, status: ${lastResult.status}`)

      if (lastResult.status === 'completed') {
        console.log('[CRON] Sync completed successfully')
        break
      }

      if (lastResult.status === 'paused') {
        console.log('[CRON] Sync paused due to too many failures')
        break
      }

      // Small delay between batches
      await new Promise(r => setTimeout(r, 1000))
    }

    return Response.json({
      success: true,
      message: `Horse sync batch completed`,
      status: lastResult?.status || 'unknown',
      currentPage: lastResult?.currentPage || 0,
      totalPages: lastResult?.totalPages || 0,
      inserted: lastResult?.inserted || 0,
      updated: lastResult?.updated || 0,
      renamed: lastResult?.renamed || 0,
      chipsCompletados: lastResult?.chipsCompletados || 0,
      errors: lastResult?.errors || [],
      timestamp: new Date().toISOString(),
      elapsedMs: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[CRON] Error in sync:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
