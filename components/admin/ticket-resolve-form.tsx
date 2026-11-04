'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PALETTE } from '@/lib/palette'
import { resolveServiceTicket, reopenServiceTicket } from '@/lib/actions/service-tickets'

interface Props {
  ticketId: string
  notasIniciales: string | null
  resuelto: boolean
}

export default function TicketResolveForm({ ticketId, notasIniciales, resuelto }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [notas, setNotas] = useState(notasIniciales ?? '')
  const [error, setError] = useState<string | null>(null)

  const run = (fn: () => Promise<void>) => {
    setError(null)
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado')
      }
    })
  }

  if (resuelto) {
    return (
      <div className="space-y-2">
        {notasIniciales && (
          <p className="text-sm whitespace-pre-wrap" style={{ color: PALETTE.text.primary }}>{notasIniciales}</p>
        )}
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => run(() => reopenServiceTicket(ticketId))}
          className="h-8 text-xs"
          style={{ border: `1px solid ${PALETTE.ui.border}`, color: PALETTE.text.secondary }}>
          {pending ? 'Reabriendo...' : 'Reabrir'}
        </Button>
        {error && <p className="text-xs" style={{ color: PALETTE.form.errorText }}>{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Textarea
        rows={3}
        value={notas}
        onChange={e => setNotas(e.target.value)}
        disabled={pending}
        placeholder="Qué se hizo para resolverlo..."
      />
      <Button
        type="button"
        disabled={pending}
        onClick={() => run(() => resolveServiceTicket(ticketId, notas))}
        className="h-8 text-xs"
        style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
        {pending ? 'Guardando...' : 'Marcar resuelto'}
      </Button>
      {error && <p className="text-xs" style={{ color: PALETTE.form.errorText }}>{error}</p>}
    </div>
  )
}
