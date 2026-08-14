'use client'
import { useRef, useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { setRedFlag } from '@/lib/actions/horses'
import { PALETTE } from '@/lib/palette'

interface Props {
  open: boolean
  onClose: () => void
  horseId: string
  horseName: string
}

export default function RedFlagModal({ open, onClose, horseId, horseName }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(formRef.current!)
    startTransition(async () => {
      try {
        await setRedFlag(horseId, formData)
        onClose()
      } catch (err: any) {
        setError(err?.message || 'Error al marcar red flag')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg"
        style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: PALETTE.text.dark }}>Marcar Red Flag</DialogTitle>
          <p className="text-xs" style={{ color: PALETTE.text.secondary }}>{horseName}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              Motivo *
            </Label>
            <Textarea
              name="reason"
              required
              placeholder="Explica por qué no se recomienda este caballo para correr..."
              rows={4}
            />
          </div>

          {error && (
            <div className="rounded-lg px-3 py-2.5"
              style={{ background: PALETTE.form.errorBg, border: `1px solid ${PALETTE.form.errorBorder}` }}>
              <p className="text-xs leading-relaxed" style={{ color: PALETTE.form.errorText }}>{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={pending} className="flex-1"
              style={{ background: '#dc2626', color: '#FFFFFF' }}>
              {pending ? 'Guardando...' : 'Marcar Red Flag'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
