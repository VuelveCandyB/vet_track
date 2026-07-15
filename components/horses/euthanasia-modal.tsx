'use client'
import { useRef, useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createEuthanasia } from '@/lib/actions/euthanasia'
import { PALETTE } from '@/lib/palette'

interface Props {
  open: boolean
  onClose: () => void
  horseId: string
  horseName: string
  vetName: string
  today: string
}

export default function EuthanasiaModal({ open, onClose, horseId, horseName, vetName, today }: Props) {
  const [pending, startTransition] = useTransition()
  const [fileName, setFileName] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!confirm('¿Confirmas el registro de eutanasia? Esta acción marcará al caballo como Fallecido.')) return
    const formData = new FormData(formRef.current!)
    startTransition(async () => {
      await createEuthanasia(horseId, formData)
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: PALETTE.text.dark }}>Registro de Eutanasia</DialogTitle>
          <p className="text-xs" style={{ color: PALETTE.text.secondary }}>{horseName}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Fecha de muerte *
              </Label>
              <Input type="date" name="fecha" required defaultValue={today} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Fecha de última carrera
              </Label>
              <Input type="date" name="fecha_ultima_carrera" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Veterinario
              </Label>
              <Input value={vetName} readOnly style={{ color: PALETTE.text.secondary, cursor: 'default' }} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Motivo / Diagnóstico *
              </Label>
              <Textarea name="motivo" rows={4} required
                placeholder="Descripción clínica del diagnóstico que justifica la eutanasia..." />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-3 rounded-lg px-3 py-3 cursor-pointer"
                style={{ background: PALETTE.background.lightAlt, border: `1px solid ${PALETTE.ui.border}` }}>
                <input type="checkbox" name="propietario_notificado"
                  className="w-4 h-4 flex-shrink-0" style={{ accentColor: '#818cf8' }} />
                <div>
                  <div className="text-sm font-medium text-white">Propietario notificado y autorización obtenida</div>
                  <div className="text-xs mt-0.5" style={{ color: '#4a5280' }}>
                    Confirma que el dueño fue informado y otorgó su autorización
                  </div>
                </div>
              </label>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Adjunto <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(acta, autorización · máx. 10 MB)</span>
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

          <div className="rounded-lg px-3 py-2.5 flex gap-2.5"
            style={{ background: PALETTE.form.errorBg, border: `1px solid ${PALETTE.status.error}` }}>
            <span className="flex-shrink-0">⚠️</span>
            <p className="text-xs leading-relaxed" style={{ color: '#fca5a5' }}>
              Esta acción marcará al caballo como <strong>Fallecido</strong> y no podrá revertirse desde la interfaz.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={pending} className="flex-1"
              style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              {pending ? 'Guardando...' : 'Registrar Eutanasia'}
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
