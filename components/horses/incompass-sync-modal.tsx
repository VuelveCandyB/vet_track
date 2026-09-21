'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  startIncompassSync,
  processIncompassSyncBatch,
} from '@/lib/actions/incompass-sync'

type Step = 'idle' | 'syncing' | 'complete'

interface SyncState {
  total: number
  processed: number
  matched: number
  updated: number
  notFound: number
  errors: string[]
}

export default function IncompassSyncModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [loading, setLoading] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [state, setState] = useState<SyncState>({
    total: 0,
    processed: 0,
    matched: 0,
    updated: 0,
    notFound: 0,
    errors: [],
  })

  const progress = state.total > 0 ? Math.round((state.processed / state.total) * 100) : 0

  async function handleStartSync() {
    setLoading(true)
    setStep('syncing')

    try {
      const { runId: newRunId, total } = await startIncompassSync()
      setRunId(newRunId)
      setState((prev) => ({ ...prev, total }))

      // Start processing batches
      await processBatch(newRunId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error iniciando sincronización')
      setStep('idle')
      setLoading(false)
    }
  }

  async function processBatch(batchRunId: string) {
    try {
      const result = await processIncompassSyncBatch(batchRunId, 25)

      setState((prev) => ({
        ...prev,
        processed: prev.processed + result.processed,
        matched: prev.matched + result.matched,
        updated: prev.updated + result.updated,
        notFound: prev.notFound + result.notFound,
        errors: [...prev.errors, ...result.errors],
      }))

      if (!result.done) {
        // Continue with next batch
        setTimeout(() => processBatch(batchRunId), 100)
      } else {
        // Sync complete
        setStep('complete')
        setLoading(false)

        const summary = `Sincronización completada: ${state.processed + result.processed} procesados, ${state.updated + result.updated} actualizados, ${state.notFound + result.notFound} no encontrados`
        toast.success(summary)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error procesando lote')
      setStep('idle')
      setLoading(false)
    }
  }

  function handleClose() {
    if (step === 'syncing' && loading) {
      // Don't allow closing while syncing is in progress
      toast.error('La sincronización está en proceso. Espera a que termine.')
      return
    }

    setOpen(false)
    // Reset when closing
    if (step === 'complete') {
      setStep('idle')
      setRunId(null)
      setState({
        total: 0,
        processed: 0,
        matched: 0,
        updated: 0,
        notFound: 0,
        errors: [],
      })
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="text-sm font-semibold min-w-fit"
        style={{ background: '#06b6d4', color: '#FFFFFF' }}
      >
        Sincronizar InCompass
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sincronizar Caballos con InCompass</DialogTitle>
            <DialogDescription>
              {step === 'idle' && 'Se sincronizarán los datos de todos los caballos con microchip'}
              {step === 'syncing' && 'Sincronización en proceso...'}
              {step === 'complete' && 'Sincronización completada'}
            </DialogDescription>
          </DialogHeader>

          {step === 'idle' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Esta operación sincronizará hasta <strong>{state.total || '1,364'}</strong> caballos con la base de datos de InCompass.
                Los datos obtenidos (nombre, registro, raza, fecha de nacimiento, tatuaje, marcas) sobrescribirán los valores locales.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>ℹ️ Nota:</strong> La sincronización se realiza en lotes de 25 caballos con pausas entre llamadas a la API. El proceso puede tomar varios minutos.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleStartSync}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Iniciar Sincronización
                </Button>
              </div>
            </div>
          )}

          {step === 'syncing' && (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Progreso</span>
                  <span className="text-sm text-gray-500">
                    {state.processed} / {state.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-lg font-bold text-green-700">{state.updated}</div>
                  <div className="text-xs text-green-600">Actualizados</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-lg font-bold text-amber-700">{state.notFound}</div>
                  <div className="text-xs text-amber-600">No encontrados</div>
                </div>
              </div>

              {/* Errors list */}
              {state.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="text-xs font-semibold text-red-700 mb-2">
                    ⚠️ {state.errors.length} error{state.errors.length !== 1 ? 'es' : ''}
                  </div>
                  <div className="space-y-1">
                    {state.errors.slice(0, 5).map((error, i) => (
                      <div key={i} className="text-xs text-red-600 font-mono">
                        {error}
                      </div>
                    ))}
                    {state.errors.length > 5 && (
                      <div className="text-xs text-red-600">
                        ... y {state.errors.length - 5} más
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center py-4">
                <div className="inline-block animate-spin mb-2">
                  <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full"></div>
                </div>
                <p className="text-xs text-gray-500">
                  Procesando... {progress}%
                </p>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-lg font-bold text-green-700">{state.updated}</div>
                  <div className="text-xs text-green-600">Actualizados</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-lg font-bold text-amber-700">{state.notFound}</div>
                  <div className="text-xs text-amber-600">No encontrados</div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <strong>Total procesados:</strong> {state.processed}
                </div>
                <div>
                  <strong>Coincidencias encontradas:</strong> {state.matched}
                </div>
              </div>

              {/* Errors summary */}
              {state.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-red-700">
                    ⚠️ Se encontraron {state.errors.length} error{state.errors.length !== 1 ? 'es' : ''}
                  </div>
                  <div className="text-xs text-red-600 mt-2 max-h-24 overflow-y-auto">
                    <ul className="space-y-1">
                      {state.errors.slice(0, 3).map((error, i) => (
                        <li key={i} className="font-mono">• {error}</li>
                      ))}
                      {state.errors.length > 3 && (
                        <li className="italic">... y {state.errors.length - 3} más</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setOpen(false)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
