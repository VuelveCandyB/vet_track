'use client'
import { useRef, useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createDiagnostico } from '@/lib/actions/diagnosticos'
import { DIAGNOSIS_TIPOS, DIAGNOSIS_POR_TIPO, SEVERIDADES, SISTEMAS_AFECTADOS } from '@/lib/constants'
import { PALETTE } from '@/lib/palette'

interface Props {
  open: boolean
  onClose: () => void
  horseId: string
  horseName: string
  vetName: string
  today: string
}

const SELECT_STYLE = { background: PALETTE.background.white, borderColor: PALETTE.ui.border, color: PALETTE.text.primary }

export default function DiagnosisModal({ open, onClose, horseId, horseName, vetName, today }: Props) {
  const [pending, startTransition] = useTransition()
  const [selectedTipo, setSelectedTipo] = useState('')
  const [fileName, setFileName] = useState('')
  const [recomendar, setRecomendar] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const diagnosticoOptions = selectedTipo ? DIAGNOSIS_POR_TIPO[selectedTipo] || [] : []

  function handleTipoChange(tipo: string) {
    setSelectedTipo(tipo)
    if (formRef.current) {
      const diagInput = formRef.current.querySelector('select[name="diagnostico"]') as HTMLSelectElement
      if (diagInput) diagInput.value = ''
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData(formRef.current!)
    startTransition(async () => {
      await createDiagnostico(horseId, formData)
      formRef.current?.reset()
      setSelectedTipo('')
      setFileName('')
      setRecomendar(false)
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: PALETTE.text.dark }}>Diagnóstico del Ejemplar</DialogTitle>
          <p className="text-xs" style={{ color: PALETTE.text.secondary }}>{horseName}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Fecha + Veterinario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Fecha *
              </Label>
              <Input type="date" name="fecha" required defaultValue={today} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Veterinario
              </Label>
              <Input value={vetName} readOnly style={{ color: '#6b7399', cursor: 'default' }} />
            </div>
          </div>

          {/* Tipo + Diagnóstico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Tipo *
              </Label>
              <select name="tipo" required
                value={selectedTipo}
                onChange={e => handleTipoChange(e.target.value)}
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={SELECT_STYLE}>
                <option value="" disabled>Seleccionar...</option>
                {DIAGNOSIS_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Diagnóstico *
              </Label>
              <select name="diagnostico" required
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={SELECT_STYLE}>
                <option value="" disabled>Seleccionar...</option>
                {diagnosticoOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Sistema Afectado + Severidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Sistema Afectado
              </Label>
              <select name="sistema_afectado"
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={SELECT_STYLE}>
                <option value="">Seleccionar...</option>
                {SISTEMAS_AFECTADOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Severidad
              </Label>
              <select name="severidad"
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={SELECT_STYLE}>
                <option value="">Seleccionar...</option>
                {SEVERIDADES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Tratamiento recomendado + Notas */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
              Tratamiento Recomendado
            </Label>
            <Textarea name="tratamiento_recomendado" rows={2} placeholder="Descripción del tratamiento..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
              Notas Adicionales
            </Label>
            <Textarea name="notas" rows={2} placeholder="Observaciones clínicas adicionales..." />
          </div>

          {/* Recomendar Vet List */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="recomendar_vetlist"
                checked={recomendar}
                onChange={e => setRecomendar(e.target.checked)}
                className="w-4 h-4 rounded" />
              <span className="text-sm font-semibold" style={{ color: PALETTE.status.error }}>
                Recomendar al Veterinario Oficial para Vet List
              </span>
            </label>
            {recomendar && (
              <div className="rounded-lg p-3 text-sm mt-2" style={{ background: PALETTE.background.lightAlt, border: `1px solid ${PALETTE.ui.border}` }}>
                <p style={{ color: '#6b7399' }}>
                  ℹ️ Este diagnóstico será enviado al veterinario oficial para revisión y aprobación de ingreso a Vet List.
                </p>
              </div>
            )}
          </div>

          {/* Adjunto */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
              Adjunto <span className="font-normal normal-case" style={{ color: PALETTE.text.secondary }}>(PDF o imagen · máx. 10 MB)</span>
            </Label>
            <label className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
              style={{ background: PALETTE.background.lightAlt, border: `1px dashed ${PALETTE.ui.border}` }}>
              <span>📎</span>
              <span className="text-sm" style={{ color: '#6b7399' }}>
                {fileName || 'Seleccionar archivo...'}
              </span>
              <input type="file" name="attachment" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
                onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={pending} className="flex-1"
              style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              {pending ? 'Guardando...' : 'Guardar Diagnóstico'}
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
