'use client'
import { useRef, useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { releaseVetlistEntry } from '@/lib/actions/vetlist'
import { PALETTE } from '@/lib/palette'
import type { VetlistEntry } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  horseId: string
  horseName: string
  entry: VetlistEntry
  vetName: string
  today: string
}

export default function VetlistReleaseModal({ open, onClose, horseId, horseName, entry, vetName, today }: Props) {
  const [pending, startTransition] = useTransition()
  const [fileName, setFileName] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData(formRef.current!)
    startTransition(async () => {
      await releaseVetlistEntry(horseId, entry.id, formData)
      formRef.current?.reset()
      setFileName('')
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: PALETTE.text.dark }}>Liberar de Vetlist</DialogTitle>
          <p className="text-xs" style={{ color: PALETTE.text.secondary }}>
            {horseName} · Ingresó el {entry.fecha_ingreso} por {entry.motivo}
          </p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Fecha de liberación *
              </Label>
              <Input type="date" name="fecha_egreso" required defaultValue={today} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Veterinario
              </Label>
              <Input value={vetName} readOnly style={{ color: PALETTE.text.secondary, cursor: 'default' }} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Resultado del examen
              </Label>
              <Textarea name="resultado_examen" rows={3}
                placeholder="Hallazgos del examen, condición actual del animal..." />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Condiciones post-alta <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(opcional)</span>
              </Label>
              <Textarea name="condiciones_post" rows={2}
                placeholder="Restricciones, seguimiento, indicaciones especiales..." />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Adjunto <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(PDF o imagen · máx. 10 MB)</span>
              </Label>
              <label className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer"
                style={{ background: PALETTE.background.lightAlt, border: `1px dashed ${PALETTE.ui.border}` }}>
                <span>📎</span>
                <span className="text-sm" style={{ color: PALETTE.text.secondary }}>
                  {fileName || 'Seleccionar archivo...'}
                </span>
                <input type="file" name="attachment" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                  className="hidden"
                  onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={pending} className="flex-1"
              style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              {pending ? 'Guardando...' : 'Confirmar Liberación'}
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
