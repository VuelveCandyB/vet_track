'use client'
import { useRef, useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { setRedFlag } from '@/lib/actions/horses'
import { EXTREMIDADES, GRADOS_REFERIDO, TIPOS_CONTACTO } from '@/lib/constants'
import { PALETTE } from '@/lib/palette'

interface Props {
  open: boolean
  onClose: () => void
  horseId: string
  horseName: string
  horseTrainer?: string
}

export default function RedFlagModal({ open, onClose, horseId, horseName, horseTrainer }: Props) {
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
        setError(err?.message || 'Error al marcar referido')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: PALETTE.text.dark }}>Marcar Referido</DialogTitle>
          <p className="text-xs" style={{ color: PALETTE.text.secondary }}>{horseName}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Motivo (required, full width) */}
            <div className="col-span-2 space-y-1.5">
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

            {/* Extremidad */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Extremidad <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(opcional)</span>
              </Label>
              <select name="extremidad"
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border, color: PALETTE.text.primary }}>
                <option value="">Seleccionar...</option>
                {EXTREMIDADES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {/* Grado */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Grado <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(opcional)</span>
              </Label>
              <select name="grado"
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border, color: PALETTE.text.primary }}>
                <option value="">Seleccionar...</option>
                {GRADOS_REFERIDO.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Elegible a Trabajar */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="elegible_trabajar" className="rounded" />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                  Elegible a Trabajar
                </span>
              </label>
            </div>

            {/* Requiere Pruebas */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="requiere_pruebas" className="rounded" />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                  Requiere Pruebas
                </span>
              </label>
            </div>

            {/* Reclamo Anulado */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="reclamo_anulado" className="rounded" />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                  Reclamo Anulado
                </span>
              </label>
            </div>

            {/* Persona Responsable */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Persona Responsable <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(opcional)</span>
              </Label>
              <Input name="persona_responsable" defaultValue={horseTrainer || ''} placeholder="Nombre" />
            </div>

            {/* Tipo de Contacto */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Tipo de Contacto <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(opcional)</span>
              </Label>
              <select name="tipo_contacto"
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border, color: PALETTE.text.primary }}>
                <option value="">Seleccionar...</option>
                {TIPOS_CONTACTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Contacto */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Contacto <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(opcional)</span>
              </Label>
              <Input name="contacto" placeholder="Teléfono o correo" />
            </div>
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
              {pending ? 'Guardando...' : 'Marcar Referido'}
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
