'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { syncHorses } from '@/lib/actions/sync'
import { Button } from '@/components/ui/button'

export default function SyncButton() {
  const [pending, setPending] = useState(false)
  const [syncInProgress, setSyncInProgress] = useState(false)

  async function handleSync() {
    setPending(true)
    setSyncInProgress(true)

    try {
      const toastId = toast.loading('Iniciando sincronización...')
      console.log('[SYNC-BUTTON] Starting sync...')

      // Process batches until complete
      let isComplete = false
      while (!isComplete) {
        console.log('[SYNC-BUTTON] Fetching batch...')
        const r = await syncHorses()
        console.log('[SYNC-BUTTON] Batch result:', r)

        if (r.errors.length > 0 && r.inserted === 0 && r.updated === 0) {
          console.error('[SYNC-BUTTON] Sync failed:', r.errors[0])
          toast.error(`Error de conexión: ${r.errors[0]}`, { id: toastId, duration: 4000 })
          isComplete = true
        } else {
          const parts = [
            r.inserted ? `${r.inserted} nuevos` : null,
            r.updated ? `${r.updated} actualizados` : null,
            r.renamed ? `${r.renamed} renombrados` : null,
            r.chipsCompletados ? `${r.chipsCompletados} microchips completados` : null,
          ].filter(Boolean).join(' · ')

          if (parts) {
            console.log('[SYNC-BUTTON] Batch success:', parts)
            toast.success(`Sincronizando: ${parts}`, { id: toastId, duration: 8000 })
          }

          // Check status to determine if we should continue
          if (r.status === 'completed') {
            console.log('[SYNC-BUTTON] Sync completed!')
            toast.success('✓ Sincronización completada', { id: toastId, duration: 3000 })
            isComplete = true
          } else if (r.status === 'paused') {
            console.warn('[SYNC-BUTTON] Sync paused due to errors')
            toast.warning('Sync pausado: demasiados errores. Reintentará la próxima semana.', { id: toastId, duration: 5000 })
            isComplete = true
          } else if (r.status === 'running') {
            console.log('[SYNC-BUTTON] Still running, fetching next batch...')
            // Continue loop
          }
        }
      }

      setSyncInProgress(false)
    } catch (error) {
      console.error('[SYNC-BUTTON] Sync error:', error)
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error durante la sincronización'}`, { duration: 4000 })
      setSyncInProgress(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      onClick={handleSync}
      disabled={pending}
      variant="ghost"
      size="sm"
      className="text-xs"
      style={{ borderColor: '#252d4a', border: '1px solid' }}
    >
      {pending ? (
        <>
          <svg className="animate-spin w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          Sincronizando...
        </>
      ) : '↻ Sync'}
    </Button>
  )
}
