'use client'
import { useRef, useState, useTransition, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createMedication } from '@/lib/actions/medications'
import { PALETTE } from '@/lib/palette'
import type { Drug } from '@/lib/types'

const RESTRICTION_COLORS: Record<string, [string, string]> = {
  'WDT':        ['#facc15', '#2e2a0d'],
  'RAT':        ['#60a5fa', '#0d1e2e'],
  'RAT+WDT':    ['#f97316', '#2e1a0d'],
  'Stand Down': ['#f87171', '#2e0d0d'],
}

const ADMIN_ROUTES = [
  'Oral',
  'Intramuscular (IM)',
  'Intravenosa (IV)',
  'Intraarticular (IA)',
  'Subcutánea (SC)',
  'Tópica',
]

const PROPOSITOS = ['Preventiva', 'Terapéutica', 'Mantenimiento', 'Seguimiento']

function inferUnit(dosisRuta?: string): string {
  if (!dosisRuta) return 'mg'
  const d = dosisRuta.toLowerCase()
  if (d.includes('ml') || d.includes('litro')) return 'mL'
  if (/ g[/ ]/.test(d) || /\d+\s*g\b/.test(d)) return 'g'
  return 'mg'
}

interface Props {
  open: boolean
  onClose: () => void
  horseId: string
  horseName: string
  drugs: Drug[]
  vetName: string
  today: string
}

const SELECT_STYLE = { background: PALETTE.background.white, borderColor: PALETTE.ui.border, color: PALETTE.text.primary }

export default function MedicationModal({ open, onClose, horseId, horseName, drugs, vetName, today }: Props) {
  const [pending, startTransition] = useTransition()
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null)
  const [fileName, setFileName] = useState('')
  const [doseAmount, setDoseAmount] = useState('')
  const [doseUnit, setDoseUnit] = useState('mg')
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const categoriaOptions = useMemo(
    () => ([...new Set(drugs.map(d => d.categoria).filter(Boolean))] as string[]).sort(),
    [drugs]
  )

  const filteredDrugs = selectedCategoria
    ? drugs.filter(d => d.categoria === selectedCategoria)
    : drugs

  function handleCategoriaChange(cat: string) {
    setSelectedCategoria(cat)
    setSelectedDrug(null)
    setDoseAmount('')
  }

  function handleDrugChange(nombre: string) {
    const drug = drugs.find(d => d.nombre === nombre) ?? null
    setSelectedDrug(drug)
    if (drug) setDoseUnit(inferUnit(drug.dosis_ruta))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(formRef.current!)
    startTransition(async () => {
      try {
        await createMedication(horseId, formData)
        formRef.current?.reset()
        setSelectedDrug(null)
        setSelectedCategoria('')
        setFileName('')
        setDoseAmount('')
        setDoseUnit('mg')
        onClose()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al guardar el medicamento'
        setError(msg)
        console.error('Error en createMedication:', err)
      }
    })
  }

  const [fg, bg] = selectedDrug?.tipo_restriccion
    ? (RESTRICTION_COLORS[selectedDrug.tipo_restriccion] ?? ['#9ca3af', '#1e2235'])
    : ['#9ca3af', '#1e2235']

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: PALETTE.text.dark }}>Registrar Medicamento</DialogTitle>
          <p className="text-xs" style={{ color: PALETTE.text.secondary }}>{horseName}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden compliance + dose fields */}
          <input type="hidden" name="drug_categoria"        value={selectedDrug?.categoria ?? ''} />
          <input type="hidden" name="detection_time_horas"  value={selectedDrug?.detection_time_horas ?? ''} />
          <input type="hidden" name="withdrawal_time_horas" value={selectedDrug?.withdrawal_time_horas ?? ''} />
          <input type="hidden" name="tipo_restriccion"      value={selectedDrug?.tipo_restriccion ?? ''} />
          <input type="hidden" name="drug_notas"            value={selectedDrug?.notas ?? ''} />
          <input type="hidden" name="dose"                  value={doseAmount ? `${doseAmount} ${doseUnit}` : ''} />

          {/* Fecha + Veterinario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Fecha *
              </Label>
              <Input type="date" name="administered_at" required defaultValue={today} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Veterinario
              </Label>
              <Input value={vetName} readOnly style={{ color: PALETTE.text.secondary, cursor: 'default' }} />
            </div>
          </div>

          {/* Vía de administración + Propósito */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Vía de administración *
              </Label>
              <select name="type" required
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={SELECT_STYLE}>
                <option value="" disabled>Seleccionar...</option>
                {ADMIN_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Propósito *
              </Label>
              <select name="proposito" required
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={SELECT_STYLE}>
                <option value="" disabled>Seleccionar...</option>
                {PROPOSITOS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Categoría (filtro) + Medicamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Categoría{' '}
                <span className="font-normal normal-case" style={{ color: PALETTE.text.secondary }}>(filtro)</span>
              </Label>
              <select
                value={selectedCategoria}
                onChange={e => handleCategoriaChange(e.target.value)}
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={SELECT_STYLE}>
                <option value="" disabled>Seleccionar...</option>
                {categoriaOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Medicamento *
              </Label>
              <select name="drug" required
                value={selectedDrug?.nombre ?? ''}
                onChange={e => handleDrugChange(e.target.value)}
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={SELECT_STYLE}>
                <option value="" disabled>Seleccionar...</option>
                {filteredDrugs.map(d => (
                  <option key={d.nombre} value={d.nombre}>
                    {d.nombre}{d.nombre_comercial ? ` (${d.nombre_comercial})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Compliance panel */}
          {selectedDrug && (
            <div className="rounded-lg p-3 text-sm" style={{ background: PALETTE.background.lightAlt, border: `1px solid ${PALETTE.ui.border}` }}>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{ color: fg, background: bg }}>
                  {selectedDrug.tipo_restriccion || 'Sin restricción'}
                </span>
                {selectedDrug.categoria && (
                  <span className="text-xs" style={{ color: PALETTE.text.secondary }}>{selectedDrug.categoria}</span>
                )}
              </div>
              <div className="flex gap-5 flex-wrap">
                {selectedDrug.withdrawal_time_horas != null && (
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{ color: PALETTE.primary.green }}>Retiro</div>
                    <div className="text-lg font-bold" style={{ color: PALETTE.text.primary }}>{selectedDrug.withdrawal_time_horas}h</div>
                    <div className="text-xs" style={{ color: PALETTE.text.secondary }}>
                      {Math.round(selectedDrug.withdrawal_time_horas / 24 * 10) / 10} días
                    </div>
                  </div>
                )}
                {selectedDrug.detection_time_horas != null && (
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{ color: PALETTE.primary.green }}>Detección</div>
                    <div className="text-lg font-bold" style={{ color: PALETTE.text.primary }}>{selectedDrug.detection_time_horas}h</div>
                    <div className="text-xs" style={{ color: PALETTE.text.secondary }}>
                      {Math.round(selectedDrug.detection_time_horas / 24 * 10) / 10} días
                    </div>
                  </div>
                )}
                {selectedDrug.notas && (
                  <div className="flex-1 min-w-36">
                    <div className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{ color: PALETTE.primary.green }}>Nota regulatoria</div>
                    <div className="text-xs leading-relaxed" style={{ color: PALETTE.text.secondary }}>{selectedDrug.notas}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dosis */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              Dosis *
            </Label>
            <div className="flex h-9 rounded-md border overflow-hidden" style={{ borderColor: PALETTE.ui.border }}>
              <input
                type="text"
                value={doseAmount}
                onChange={e => setDoseAmount(e.target.value)}
                required
                placeholder="ej. 5"
                className="flex-1 min-w-0 px-3 text-sm"
                style={{ color: PALETTE.text.primary, background: PALETTE.background.white, borderColor: PALETTE.ui.border }}
              />
              <select
                value={doseUnit}
                onChange={e => setDoseUnit(e.target.value)}
                className="border-l px-2 text-sm"
                style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border, color: PALETTE.text.primary }}
              >
                <option value="mL">mL</option>
                <option value="Litros">Litros</option>
                <option value="mg">mg</option>
                <option value="g">g</option>
                <option value="Scoop">Scoop</option>
                <option value="Unidad">Unidad</option>
              </select>
            </div>
          </div>

          {/* Notas + Adjunto */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>Notas</Label>
            <Textarea name="notes" rows={2} placeholder="Observaciones, reacciones..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              Adjunto <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(PDF o imagen · máx. 10 MB)</span>
            </Label>
            <label className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
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

          {error && (
            <div className="rounded-lg p-3 text-sm" style={{ background: '#fee2e2', border: '1px solid #dc2626', color: '#7f1d1d' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={pending} className="flex-1"
              style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
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
