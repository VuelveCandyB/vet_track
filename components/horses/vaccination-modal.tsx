'use client'
import { useRef, useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createVaccination } from '@/lib/actions/vaccinations'
import { PALETTE } from '@/lib/palette'

interface Props {
  open: boolean
  onClose: () => void
  horseId: string
  horseName: string
  vetName: string
  today: string
}

export default function VaccinationModal({ open, onClose, horseId, horseName, vetName, today }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(formRef.current!)
    startTransition(async () => {
      try {
        await createVaccination(horseId, formData)
        onClose()
      } catch (err: any) {
        setError(err?.message || 'Error al registrar la vacunación')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg"
        style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: PALETTE.text.dark }}>Registro de Vacunación</DialogTitle>
          <p className="text-xs" style={{ color: PALETTE.text.secondary }}>{horseName}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Fecha Vacuna *
              </Label>
              <Input type="date" name="fecha" required defaultValue={today} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Veterinario
              </Label>
              <Input value={vetName} readOnly style={{ color: PALETTE.text.secondary, cursor: 'default' }} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Notas adicionales
              </Label>
              <Textarea name="notas" rows={3} placeholder="Notas opcionales..." />
            </div>
          </div>

          <div className="rounded-lg px-3 py-2.5 flex gap-2.5"
            style={{ background: PALETTE.background.lightAlt, border: `1px solid ${PALETTE.ui.border}` }}>
            <p className="text-xs leading-relaxed" style={{ color: PALETTE.text.secondary }}>
              Recordatorio: es requisito las 5 vacunas West Nile, Rhinopneumonitis, Tetanus, Rabies and Flu.
            </p>
          </div>

          {error && (
            <div className="rounded-lg px-3 py-2.5"
              style={{ background: PALETTE.form.errorBg, border: `1px solid ${PALETTE.form.errorBorder}` }}>
              <p className="text-xs leading-relaxed" style={{ color: PALETTE.form.errorText }}>{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={pending} className="flex-1"
              style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              {pending ? 'Guardando...' : 'Registrar Vacuna'}
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
