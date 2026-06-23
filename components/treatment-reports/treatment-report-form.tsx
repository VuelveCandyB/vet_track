'use client'
import { useRef, useState, useTransition } from 'react'
import { createTreatmentReport, updateTreatmentReport } from '@/lib/actions/treatment-reports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TreatmentReportFormSkeleton } from './treatment-report-form-skeleton'
import { PALETTE } from '@/lib/palette'
import type { Horse, Drug } from '@/lib/types'

interface TreatmentReportFormProps {
  horses: Horse[]
  drugs: Drug[]
  vetName: string
  defaultValues?: {
    id?: string
    horse_id?: string
    drug_id?: string
    numero_identificacion_caballo?: string
    establo?: string
    tratamiento?: string
    diagnostico?: string
    fecha_tratamiento?: string
    hora_tratamiento?: string
    dosis?: number
    dosis_unidad?: string
    nivel_dosificacion?: string
    tiempo_restriccion?: number
    notas?: string
    vet_autorizado_nombre?: string
  }
  mode?: 'create' | 'edit'
  onSuccess?: () => void
}

export default function TreatmentReportForm({
  horses,
  drugs,
  vetName,
  defaultValues,
  mode = 'create',
  onSuccess,
}: TreatmentReportFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [selectedDrugId, setSelectedDrugId] = useState<string>(defaultValues?.drug_id ?? '')
  const [fechaFin, setFechaFin] = useState<string>('')

  const selectedDrug = drugs.find(d => d.id === selectedDrugId)
  const tieneRestriccion = selectedDrug?.tipo_restriccion != null

  const handleDrugChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const drugId = e.target.value
    const selectedDrug = drugs.find(d => d.id === drugId)
    setSelectedDrugId(drugId)

    // Auto-fill tiempo_restriccion from drug withdrawal_time_horas
    const tiempoInput = formRef.current?.querySelector<HTMLInputElement>('input[name="tiempo_restriccion"]')
    if (tiempoInput && selectedDrug?.withdrawal_time_horas) {
      tiempoInput.value = selectedDrug.withdrawal_time_horas.toString()
    }

    calcularFechaFin(
      formRef.current?.querySelector<HTMLInputElement>('input[name="fecha_tratamiento"]')?.value ?? '',
      selectedDrug?.withdrawal_time_horas ?? null
    )
  }

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    calcularFechaFin(e.target.value, selectedDrug?.withdrawal_time_horas ?? null)
  }

  const handleTiempoRestriccionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fecha = formRef.current?.querySelector<HTMLInputElement>('input[name="fecha_tratamiento"]')?.value
    calcularFechaFin(fecha ?? '', parseInt(e.target.value) || null)
  }

  const calcularFechaFin = (fechaStr: string, horas: number | null) => {
    if (!fechaStr || !horas) {
      setFechaFin('')
      return
    }
    const fecha = new Date(fechaStr)
    fecha.setHours(fecha.getHours() + horas)
    setFechaFin(fecha.toISOString().split('T')[0])
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(formRef.current!)
    formData.set('vet_autorizado_nombre', vetName)

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createTreatmentReport(formData)
        } else if (defaultValues?.id) {
          await updateTreatmentReport(defaultValues.id, formData)
        }
        formRef.current?.reset()
        // Call success callback or let server action handle navigation
        onSuccess?.()
      } catch (err) {
        console.error(err)
        alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    })
  }

  if (pending) {
    return <TreatmentReportFormSkeleton />
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-5">
      {/* SECCIÓN: INFORMACIÓN DEL CABALLO */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.primary.green }}>
          Información del Caballo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="horse_id" style={{ color: PALETTE.text.primary }}>Caballo *</Label>
            <select
              id="horse_id"
              name="horse_id"
              defaultValue={defaultValues?.horse_id ?? ''}
              required
              onChange={(e) => {
                const horseId = e.target.value
                const horse = horses.find(h => h.id === horseId)
                if (horse && formRef.current) {
                  const idInput = formRef.current.querySelector<HTMLInputElement>('input[name="numero_identificacion_caballo"]')
                  if (idInput) {
                    idInput.value = horse.microchip || horse.registration || ''
                  }
                }
              }}
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm mt-1"
              style={{
                borderColor: PALETTE.ui.border,
                backgroundColor: '#FFFFFF',
                color: PALETTE.text.primary,
              }}
            >
              <option value="">Seleccionar caballo...</option>
              {horses.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="numero_identificacion_caballo" style={{ color: PALETTE.text.primary }}>Número de Identificación</Label>
            <Input
              id="numero_identificacion_caballo"
              name="numero_identificacion_caballo"
              placeholder="Auto-completado..."
              defaultValue={defaultValues?.numero_identificacion_caballo ?? ''}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="establo" style={{ color: PALETTE.text.primary }}>Establo *</Label>
            <Input
              id="establo"
              name="establo"
              placeholder="Ej: Establo A, Barn North..."
              defaultValue={defaultValues?.establo ?? ''}
              required
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN: MEDICAMENTO */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.primary.green }}>
          Medicamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="\1" style={{ color: PALETTE.text.primary }}>Medicamento *</Label>
            <select
              id="drug_id"
              name="drug_id"
              value={selectedDrugId}
              onChange={handleDrugChange}
              required
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm mt-1"
              style={{
                borderColor: PALETTE.ui.border,
                backgroundColor: '#FFFFFF',
                color: PALETTE.text.primary,
              }}
            >
              <option value="">Seleccionar medicamento...</option>
              {drugs.map(d => (
                <option key={d.id} value={d.id}>
                  {d.nombre} {d.tipo_restriccion ? `[${d.tipo_restriccion}]` : ''}
                </option>
              ))}
            </select>
            {selectedDrug && (
              <p className="text-xs mt-1" style={{ color: PALETTE.text.secondary }}>
                Categoría: {selectedDrug.categoria}
                {selectedDrug.tipo_restriccion && ` | Restricción: ${selectedDrug.tipo_restriccion}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN: DIAGNÓSTICO Y TRATAMIENTO */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.primary.green }}>
          Diagnóstico y Tratamiento
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="\1" style={{ color: PALETTE.text.primary }}>Diagnóstico *</Label>
            <Textarea
              id="diagnostico"
              name="diagnostico"
              placeholder="Descripción del diagnóstico..."
              defaultValue={defaultValues?.diagnostico ?? ''}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="\1" style={{ color: PALETTE.text.primary }}>Tratamiento</Label>
            <Textarea
              id="tratamiento"
              name="tratamiento"
              placeholder="Descripción del tratamiento realizado..."
              defaultValue={defaultValues?.tratamiento ?? ''}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN: ADMINISTRACIÓN */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.primary.green }}>
          Administración del Medicamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="\1" style={{ color: PALETTE.text.primary }}>Fecha de Tratamiento *</Label>
            <Input
              id="fecha_tratamiento"
              name="fecha_tratamiento"
              type="date"
              defaultValue={defaultValues?.fecha_tratamiento ?? ''}
              required
              onChange={handleFechaChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="\1" style={{ color: PALETTE.text.primary }}>Hora de Tratamiento *</Label>
            <Input
              id="hora_tratamiento"
              name="hora_tratamiento"
              type="time"
              defaultValue={defaultValues?.hora_tratamiento ?? ''}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="\1" style={{ color: PALETTE.text.primary }}>Dosis *</Label>
            <Input
              id="dosis"
              name="dosis"
              type="number"
              step="0.01"
              defaultValue={defaultValues?.dosis ?? ''}
              required
              placeholder="Ej: 500"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="\1" style={{ color: PALETTE.text.primary }}>Unidad *</Label>
            <select
              id="dosis_unidad"
              name="dosis_unidad"
              defaultValue={defaultValues?.dosis_unidad ?? 'mg'}
              required
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm mt-1"
              style={{
                borderColor: PALETTE.ui.border,
                backgroundColor: '#FFFFFF',
                color: PALETTE.text.primary,
              }}
            >
              <option value="mg">mg</option>
              <option value="ml">ml</option>
              <option value="cc">cc</option>
              <option value="g">g</option>
              <option value="IU">IU</option>
            </select>
          </div>

          <div>
            <Label htmlFor="\1" style={{ color: PALETTE.text.primary }}>Nivel de Dosificación</Label>
            <Input
              id="nivel_dosificacion"
              name="nivel_dosificacion"
              placeholder="Ej: Terapéutico, Profiláctico, etc."
              defaultValue={defaultValues?.nivel_dosificacion ?? ''}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN: RESTRICCIONES (condicional) */}
      {tieneRestriccion && (
        <div className="p-6 rounded-lg" style={{ background: '#fffbeb', border: `1px solid #fcd34d`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.primary.green }}>
            Restricciones de Participación en Carreras
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="\1" style={{ color: PALETTE.text.primary }}>Tiempo de Restricción (horas) *</Label>
              <Input
                id="tiempo_restriccion"
                name="tiempo_restriccion"
                type="number"
                defaultValue={defaultValues?.tiempo_restriccion ?? ''}
                onChange={handleTiempoRestriccionChange}
                required={tieneRestriccion}
                placeholder="Ej: 48"
                className="mt-1"
              />
            </div>
            {fechaFin && (
              <div>
                <Label>Fecha de Fin de Restricción</Label>
                <div className="mt-1 px-3 py-2 rounded-md" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
                  <p className="font-semibold">{fechaFin}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN: NOTAS */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.primary.green }}>
          Información Adicional
        </h3>
        <div>
          <Label htmlFor="notas">Notas</Label>
          <Textarea
            id="notas"
            name="notas"
            placeholder="Cualquier información adicional requerida..."
            defaultValue={defaultValues?.notas ?? ''}
            className="mt-1"
          />
        </div>
      </div>

      {/* Hidden inputs para los valores que no son editable directo */}
      <input type="hidden" name="fecha_fin_tratamiento" value={fechaFin} />
      <input type="hidden" name="vet_autorizado_nombre" value={vetName} />
      {defaultValues?.horse_id && (
        <input type="hidden" name="from_horse" value={defaultValues.horse_id} />
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-6 justify-center md:justify-start">
        <Button
          type="submit"
          disabled={pending}
          style={{
            background: PALETTE.primary.green,
            color: '#fff',
          }}
        >
          {pending ? 'Guardando...' : mode === 'create' ? 'Crear Informe' : 'Actualizar Informe'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
