'use client'
import { useRef, useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createVetlistEntry } from '@/lib/actions/vetlist'
import { MOTIVOS_VETLIST } from '@/lib/constants'

interface Props {
  open: boolean
  onClose: () => void
  horseId: string
  horseName: string
  vetName: string
  today: string
}

export default function VetlistModal({ open, onClose, horseId, horseName, vetName, today }: Props) {
  const [pending, startTransition] = useTransition()
  const [fileName, setFileName] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData(formRef.current!)
    startTransition(async () => {
      await createVetlistEntry(horseId, formData)
      formRef.current?.reset()
      setFileName('')
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
        <DialogHeader>
          <DialogTitle className="text-white">Agregar a Vetlist</DialogTitle>
          <p className="text-xs" style={{ color: '#4a5280' }}>{horseName}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Fecha de ingreso *
              </Label>
              <Input type="date" name="fecha_ingreso" required defaultValue={today} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Veterinario
              </Label>
              <Input value={vetName} readOnly style={{ color: '#6b7399', cursor: 'default' }} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Motivo *
              </Label>
              <select name="motivo" required
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={{ background: '#13162080', borderColor: '#2a2d3e', color: '#e2e8f0' }}>
                <option value="" disabled>Seleccionar...</option>
                {MOTIVOS_VETLIST.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Descripción clínica
              </Label>
              <Textarea name="descripcion" rows={3}
                placeholder="Hallazgos clínicos, observaciones, diagnóstico preliminar..." />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Inicio descanso <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(opcional)</span>
              </Label>
              <Input type="date" name="fecha_inicio_descanso" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Fin descanso <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(opcional)</span>
              </Label>
              <Input type="date" name="fecha_fin_descanso" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Adjunto <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(PDF o imagen · máx. 10 MB)</span>
              </Label>
              <label className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer"
                style={{ background: '#13162080', border: '1px dashed #2a2d3e' }}>
                <span>📎</span>
                <span className="text-sm" style={{ color: '#6b7399' }}>
                  {fileName || 'Seleccionar archivo...'}
                </span>
                <input type="file" name="attachment" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                  className="hidden"
                  onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
              </label>
            </div>
          </div>

          <div className="rounded-lg px-3 py-2.5 flex gap-2.5"
            style={{ background: '#2e0d0d', border: '1px solid #f8717140' }}>
            <span className="flex-shrink-0">⚠️</span>
            <p className="text-xs leading-relaxed" style={{ color: '#f87171' }}>
              Al agregar este caballo a la vetlist quedará inhabilitado para correr hasta que un veterinario lo libere.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={pending} className="flex-1"
              style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}>
              {pending ? 'Guardando...' : 'Agregar a Vetlist'}
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
