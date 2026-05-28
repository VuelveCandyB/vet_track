'use client'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { syncHorses } from '@/lib/actions/sync'
import { Button } from '@/components/ui/button'

export default function SyncButton() {
  const [pending, startTransition] = useTransition()

  function handleSync() {
    startTransition(async () => {
      const toastId = toast.loading('Sincronizando caballos...')
      const r = await syncHorses()
      if (r.errors.length > 0 && r.total === 0) {
        toast.error('Error de conexión con el sitio externo', { id: toastId })
      } else {
        toast.success(
          `${r.total} caballos — ${r.inserted} nuevos, ${r.updated} actualizados${r.errors.length ? ` · ${r.errors.length} errores` : ''}`,
          { id: toastId }
        )
      }
    })
  }

  return (
    <Button onClick={handleSync} disabled={pending} variant="ghost" size="sm"
      className="text-xs" style={{ borderColor: '#252d4a', border: '1px solid' }}>
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
