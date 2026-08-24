'use client'
import { useRef, useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTreatmentReport, updateTreatmentReport } from '@/lib/actions/treatment-reports'
import type { createPMFRecord, updatePMFRecord } from '@/lib/actions/pmf-records'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ItemCodesSelect from './item-codes-select'
import { TreatmentReportFormSkeleton } from './treatment-report-form-skeleton'
import { PALETTE } from '@/lib/palette'
import type { Horse, Drug } from '@/lib/types'
import type { CatalogItem } from './item-codes-select'

const ConfirmationModal = ({
  isOpen,
  onConfirm,
  onCancel,
  isPending
}: {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) => {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '8px',
          color: PALETTE.text.primary,
        }}>
          ¿Estás seguro?
        </h2>
        <p style={{
          fontSize: '14px',
          color: PALETTE.text.secondary,
          marginBottom: '24px',
          lineHeight: '1.5',
        }}>
          Al someter este informe de tratamiento, se enviará al Director de Servicios Médicos-Veterinarios para su radicación en Secretaría (Art. 811). No podrás editarlo después.
        </p>
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <Button
            onClick={onCancel}
            variant="secondary"
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            style={{ background: PALETTE.primary.green, color: '#fff' }}
          >
            {isPending ? 'Sometiendo...' : 'Sí, estoy seguro'}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface MedicationRow {
  id: string
  drug_id: string
  dosis: string
  dosis_unidad: string
  nivel_dosificacion: string
  selectedCategoria: string
}

interface TreatmentReportFormProps {
  horses: Horse[]
  drugs: Drug[]
  vetName: string
  itemCodes?: CatalogItem[]
  initialSelectedItemCodeIds?: string[]
  initialMedications?: MedicationRow[]
  defaultValues?: {
    id?: string
    horse_id?: string
    numero_identificacion_caballo?: string
    establo?: string
    tratamiento?: string
    diagnostico?: string
    fecha_tratamiento?: string
    hora_tratamiento?: string
    notas?: string
    vet_autorizado_nombre?: string
  }
  mode?: 'create' | 'edit'
  onSuccess?: () => void
  createAction?: typeof createTreatmentReport | typeof createPMFRecord
  updateAction?: typeof updateTreatmentReport | typeof updatePMFRecord
}

const makeEmptyRow = (): MedicationRow => ({
  id: Math.random().toString(36).substring(7),
  drug_id: '',
  dosis: '',
  dosis_unidad: 'mg',
  nivel_dosificacion: '',
  selectedCategoria: '',
})

export default function TreatmentReportForm({
  horses,
  drugs,
  vetName,
  itemCodes = [],
  initialSelectedItemCodeIds = [],
  initialMedications,
  defaultValues,
  mode = 'create',
  onSuccess,
  createAction = createTreatmentReport,
  updateAction = updateTreatmentReport,
}: TreatmentReportFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [rows, setRows] = useState<MedicationRow[]>(initialMedications?.length ? initialMedications : [makeEmptyRow()])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formDataToSubmit, setFormDataToSubmit] = useState<FormData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const categories = Array.from(new Set(drugs.map(d => d.categoria).filter(Boolean)))

  // Auto-fill microchip when horse is pre-selected
  useEffect(() => {
    if (defaultValues?.horse_id && formRef.current) {
      const horse = horses.find(h => h.id === defaultValues.horse_id)
      const idInput = formRef.current.querySelector<HTMLInputElement>('input[name="numero_identificacion_caballo"]')
      if (horse && idInput) {
        idInput.value = horse.microchip || horse.registration || ''
      }
    }
  }, [defaultValues?.horse_id, horses])

  const updateRow = (index: number, updates: Partial<MedicationRow>) => {
    setRows(rows.map((row, i) => i === index ? { ...row, ...updates } : row))
  }

  const handleCategoriaChange = (index: number, categoria: string) => {
    updateRow(index, { selectedCategoria: categoria, drug_id: '' })
  }

  const handleDrugChange = (index: number, drugId: string) => {
    updateRow(index, { drug_id: drugId })
  }

  const addRow = () => {
    setRows([...rows, makeEmptyRow()])
  }

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // Validar que cada fila tenga los campos requeridos
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row.drug_id?.trim()) {
        setError(`Fila ${i + 1}: Debe seleccionar un medicamento`)
        return
      }
      if (!row.dosis?.trim()) {
        setError(`Fila ${i + 1}: Debe ingresar la dosis`)
        return
      }
    }

    if (mode === 'create') {
      const formData = new FormData(formRef.current!)
      formData.set('vet_autorizado_nombre', vetName)

      // Serializar medicamentos a JSON
      const medicationsPayload = rows.map(row => {
        const drug = drugs.find(d => d.id === row.drug_id)
        return {
          drug_id: row.drug_id,
          dosis: parseFloat(row.dosis),
          dosis_unidad: row.dosis_unidad || 'mg',
          nivel_dosificacion: row.nivel_dosificacion || null,
          tiempo_restriccion: drug?.withdrawal_time_horas || null,
          hasta_cuando: null,
        }
      })

      formData.set('medications', JSON.stringify(medicationsPayload))
      setFormDataToSubmit(formData)
      setShowConfirmation(true)
    } else {
      const formData = new FormData(formRef.current!)
      formData.set('vet_autorizado_nombre', vetName)

      const medicationsPayload = rows.map(row => {
        const drug = drugs.find(d => d.id === row.drug_id)
        return {
          drug_id: row.drug_id,
          dosis: parseFloat(row.dosis),
          dosis_unidad: row.dosis_unidad || 'mg',
          nivel_dosificacion: row.nivel_dosificacion || null,
          tiempo_restriccion: drug?.withdrawal_time_horas || null,
          hasta_cuando: null,
        }
      })

      formData.set('medications', JSON.stringify(medicationsPayload))

      startTransition(async () => {
        try {
          if (defaultValues?.id) {
            await updateAction(defaultValues.id, formData)
            formRef.current?.reset()
            onSuccess?.()
          }
        } catch (err) {
          alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      })
    }
  }

  const handleConfirmSubmit = () => {
    if (!formDataToSubmit) return

    startTransition(async () => {
      try {
        const redirectUrl = await createAction(formDataToSubmit)
        formRef.current?.reset()
        setShowConfirmation(false)
        setFormDataToSubmit(null)
        setRows([makeEmptyRow()])
        if (redirectUrl) {
          router.push(redirectUrl)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setShowConfirmation(false)
      }
    })
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
    setFormDataToSubmit(null)
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
              disabled={!!defaultValues?.horse_id}
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
                backgroundColor: defaultValues?.horse_id ? '#F3F4F6' : '#FFFFFF',
                color: PALETTE.text.primary,
                cursor: defaultValues?.horse_id ? 'not-allowed' : 'pointer',
                opacity: defaultValues?.horse_id ? 0.6 : 1,
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
            <Label htmlFor="vet_name" style={{ color: PALETTE.text.primary }}>Veterinario Autorizado</Label>
            <Input
              id="vet_name"
              name="vet_name"
              value={vetName}
              readOnly
              className="mt-1"
              style={{ backgroundColor: '#F3F4F6', opacity: 0.7 }}
            />
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
            <Label htmlFor="item_codes" style={{ color: PALETTE.text.primary }}>Códigos de Diagnóstico / Procedimientos *</Label>
            <div className="mt-2">
              <ItemCodesSelect
                items={itemCodes}
                selected={initialSelectedItemCodeIds}
                required={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN: MEDICAMENTOS */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.primary.green }}>
          Medicamentos
        </h3>

        {error && (
          <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #dc2626', borderRadius: '8px', marginBottom: '16px' }}>
            <p className="text-sm" style={{ color: '#7f1d1d' }}>⚠️ {error}</p>
          </div>
        )}

        {rows.map((row, idx) => {
          const filteredDrugs = row.selectedCategoria ? drugs.filter(d => d.categoria === row.selectedCategoria) : drugs
          const selectedDrug = drugs.find(d => d.id === row.drug_id)

          return (
            <div key={row.id} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: `1px solid ${PALETTE.ui.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 className="text-sm font-semibold" style={{ color: PALETTE.text.primary }}>Medicamento {idx + 1}</h4>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    disabled={pending}
                    style={{
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #dc2626',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: pending ? 'not-allowed' : 'pointer',
                      opacity: pending ? 0.6 : 1,
                    }}
                  >
                    ✕ Quitar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label style={{ color: PALETTE.text.primary }}>Categoría *</Label>
                  <select
                    value={row.selectedCategoria}
                    onChange={(e) => handleCategoriaChange(idx, e.target.value)}
                    required
                    disabled={pending}
                    className="flex h-9 w-full rounded-md border px-3 py-1 text-sm mt-1"
                    style={{
                      borderColor: PALETTE.ui.border,
                      backgroundColor: '#FFFFFF',
                      color: PALETTE.text.primary,
                      opacity: pending ? 0.6 : 1,
                    }}
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label style={{ color: PALETTE.text.primary }}>Medicamento *</Label>
                  <select
                    value={row.drug_id}
                    onChange={(e) => handleDrugChange(idx, e.target.value)}
                    required
                    disabled={!row.selectedCategoria || pending}
                    className="flex h-9 w-full rounded-md border px-3 py-1 text-sm mt-1"
                    style={{
                      borderColor: PALETTE.ui.border,
                      backgroundColor: !row.selectedCategoria ? '#F3F4F6' : '#FFFFFF',
                      color: PALETTE.text.primary,
                      cursor: !row.selectedCategoria ? 'not-allowed' : 'pointer',
                      opacity: (!row.selectedCategoria || pending) ? 0.6 : 1,
                    }}
                  >
                    <option value="">Seleccionar medicamento...</option>
                    {filteredDrugs.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nombre} {d.tipo_restriccion ? `(${d.tipo_restriccion})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label style={{ color: PALETTE.text.primary }}>Dosis *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={row.dosis}
                    onChange={(e) => updateRow(idx, { dosis: e.target.value })}
                    placeholder={selectedDrug && selectedDrug.dosis_min !== null && selectedDrug.dosis_max !== null
                      ? `Ej: ${selectedDrug.dosis_min}–${selectedDrug.dosis_max}`
                      : 'Ej: 500'}
                    required
                    disabled={pending}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label style={{ color: PALETTE.text.primary }}>Unidad *</Label>
                  <select
                    value={row.dosis_unidad}
                    onChange={(e) => updateRow(idx, { dosis_unidad: e.target.value })}
                    required
                    disabled={pending}
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
                    <option value="mg/kg">mg/kg</option>
                    <option value="mcg/kg">mcg/kg</option>
                    <option value="g/kg">g/kg</option>
                    <option value="IU/kg">IU/kg</option>
                  </select>
                </div>

                <div>
                  <Label style={{ color: PALETTE.text.primary }}>Nivel de Dosificación</Label>
                  <Input
                    value={row.nivel_dosificacion}
                    onChange={(e) => updateRow(idx, { nivel_dosificacion: e.target.value })}
                    placeholder="Ej: Terapéutico, Profiláctico, etc."
                    disabled={pending}
                    className="mt-1"
                  />
                </div>
              </div>

              {selectedDrug && (
                <div style={{ padding: '12px 16px', background: '#f0fdf4', border: `1px solid ${PALETTE.ui.border}`, borderRadius: '8px' }}>
                  <p className="text-xs" style={{ color: PALETTE.text.secondary }}>
                    {selectedDrug.tipo_restriccion && (
                      <>
                        <strong>Tipo de restricción:</strong> {selectedDrug.tipo_restriccion}
                        {selectedDrug.withdrawal_time_horas && (
                          <> · {selectedDrug.withdrawal_time_horas}h ({selectedDrug.withdrawal_time_dias} días)</>
                        )}
                      </>
                    )}
                    {!selectedDrug.tipo_restriccion && <span>Sin restricción</span>}
                  </p>
                </div>
              )}
            </div>
          )
        })}

        <Button
          type="button"
          onClick={addRow}
          disabled={pending}
          variant="secondary"
          className="w-full"
        >
          + Agregar otro medicamento
        </Button>
      </div>

      {/* SECCIÓN: FECHA Y HORA */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.primary.green }}>
          Fecha y Hora
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fecha_tratamiento" style={{ color: PALETTE.text.primary }}>Fecha de Tratamiento *</Label>
            <Input
              id="fecha_tratamiento"
              name="fecha_tratamiento"
              type="date"
              defaultValue={defaultValues?.fecha_tratamiento ?? ''}
              required
              disabled={pending}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="hora_tratamiento" style={{ color: PALETTE.text.primary }}>Hora de Tratamiento *</Label>
            <Input
              id="hora_tratamiento"
              name="hora_tratamiento"
              type="time"
              defaultValue={defaultValues?.hora_tratamiento ?? ''}
              required
              disabled={pending}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN: NOTAS */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.primary.green }}>
          Información Adicional
        </h3>
        <div>
          <Label htmlFor="notas">Notas / Tratamiento Adicional</Label>
          <Textarea
            id="notas"
            name="notas"
            placeholder="Cualquier información adicional requerida o notas sobre el tratamiento..."
            defaultValue={defaultValues?.notas ?? ''}
            disabled={pending}
            className="mt-1"
          />
        </div>
      </div>

      {/* Hidden inputs */}
      <input type="hidden" name="vet_autorizado_nombre" value={vetName} />
      {defaultValues?.horse_id && (
        <>
          <input type="hidden" name="horse_id" value={defaultValues.horse_id} />
          <input type="hidden" name="from_horse" value={defaultValues.horse_id} />
        </>
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
          {pending ? 'Guardando...' : mode === 'create' ? `Someter Informe (${rows.length} med.)` : 'Actualizar Informe'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelConfirmation}
        isPending={pending}
      />
    </form>
  )
}
