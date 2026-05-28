'use client'
import { useRef, useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createMedication } from '@/lib/actions/medications'
import type { Drug } from '@/lib/types'

const RESTRICTION_COLORS: Record<string, [string, string]> = {
  'WDT':        ['#facc15', '#2e2a0d'],
  'RAT':        ['#60a5fa', '#0d1e2e'],
  'RAT+WDT':    ['#f97316', '#2e1a0d'],
  'Stand Down': ['#f87171', '#2e0d0d'],
}

interface Props {
  open: boolean
  onClose: () => void
  horseId: string
  horseName: string
  drugs: Drug[]
  medTypes: string[]
  doseSuggestions: string[]
  vetName: string
  today: string
}

export default function MedicationModal({ open, onClose, horseId, horseName, drugs, medTypes, doseSuggestions, vetName, today }: Props) {
  const [pending, startTransition] = useTransition()
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null)
  const [fileName, setFileName] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handleDrugChange(nombre: string) {
    const drug = drugs.find(d => d.nombre === nombre) ?? null
    setSelectedDrug(drug)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData(formRef.current!)
    startTransition(async () => {
      await createMedication(horseId, formData)
      formRef.current?.reset()
      setSelectedDrug(null)
      setFileName('')
      onClose()
    })
  }

  const [fg, bg] = selectedDrug?.tipo_restriccion
    ? (RESTRICTION_COLORS[selectedDrug.tipo_restriccion] ?? ['#9ca3af', '#1e2235'])
    : ['#9ca3af', '#1e2235']

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto"
        style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
        <DialogHeader>
          <DialogTitle className="text-white">Registrar Medicamento</DialogTitle>
          <p className="text-xs" style={{ color: '#4a5280' }}>{horseName}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden compliance fields */}
          <input type="hidden" name="drug_categoria"        value={selectedDrug?.categoria ?? ''} />
          <input type="hidden" name="detection_time_horas"  value={selectedDrug?.detection_time_horas ?? ''} />
          <input type="hidden" name="withdrawal_time_horas" value={selectedDrug?.withdrawal_time_horas ?? ''} />
          <input type="hidden" name="tipo_restriccion"      value={selectedDrug?.tipo_restriccion ?? ''} />
          <input type="hidden" name="drug_notas"            value={selectedDrug?.notas ?? ''} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Fecha *
              </Label>
              <Input type="date" name="administered_at" required defaultValue={today} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Veterinario
              </Label>
              <Input value={vetName} readOnly style={{ color: '#6b7399', cursor: 'default' }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Tipo *
              </Label>
              <select name="type" required
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={{ background: '#13162080', borderColor: '#2a2d3e', color: '#e2e8f0' }}>
                <option value="" disabled>Seleccionar...</option>
                {medTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Medicamento *
              </Label>
              <select name="drug" required onChange={e => handleDrugChange(e.target.value)}
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={{ background: '#13162080', borderColor: '#2a2d3e', color: '#e2e8f0' }}>
                <option value="" disabled>Seleccionar...</option>
                {drugs.map(d => (
                  <option key={d.nombre} value={d.nombre}>
                    {d.nombre}{d.nombre_comercial ? ` (${d.nombre_comercial})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Compliance panel */}
          {selectedDrug && (
            <div className="rounded-lg p-3 text-sm" style={{ background: '#0d102080', border: '1px solid #2a2d3e' }}>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{ color: fg, background: bg }}>
                  {selectedDrug.tipo_restriccion || 'Sin restricción'}
                </span>
                {selectedDrug.categoria && <span className="text-xs" style={{ color: '#6b7399' }}>{selectedDrug.categoria}</span>}
              </div>
              <div className="flex gap-5 flex-wrap">
                {selectedDrug.withdrawal_time_horas != null && (
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#4a5280' }}>Retiro</div>
                    <div className="text-lg font-bold" style={{ color: fg }}>{selectedDrug.withdrawal_time_horas}h</div>
                    <div className="text-xs" style={{ color: '#4a5280' }}>{Math.round(selectedDrug.withdrawal_time_horas / 24 * 10) / 10} días</div>
                  </div>
                )}
                {selectedDrug.detection_time_horas != null && (
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#4a5280' }}>Detección</div>
                    <div className="text-lg font-bold" style={{ color: '#818cf8' }}>{selectedDrug.detection_time_horas}h</div>
                    <div className="text-xs" style={{ color: '#4a5280' }}>{Math.round(selectedDrug.detection_time_horas / 24 * 10) / 10} días</div>
                  </div>
                )}
                {selectedDrug.notas && (
                  <div className="flex-1 min-w-36">
                    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#f97316' }}>Nota regulatoria</div>
                    <div className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>{selectedDrug.notas}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>Dosis *</Label>
              <Input name="dose" required list="dose-suggestions"
                placeholder={selectedDrug?.dosis_ruta || 'ej. 5 mg/kg IV'} />
              <datalist id="dose-suggestions">
                {doseSuggestions.map(d => <option key={d} value={d} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>Cantidad</Label>
              <Input name="quantity" placeholder="ej. 1 vial, 10 ml" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>Notas</Label>
              <Textarea name="notes" rows={2} placeholder="Observaciones, reacciones..." />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                Adjunto <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(PDF o imagen · máx. 10 MB)</span>
              </Label>
              <label className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
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

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={pending} className="flex-1"
              style={{ background: 'linear-gradient(135deg, #3a55e8, #7c3aed)' }}>
              {pending ? 'Guardando...' : 'Guardar Registro'}
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
