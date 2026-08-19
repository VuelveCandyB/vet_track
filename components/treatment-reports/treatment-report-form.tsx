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

interface TreatmentReportFormProps {
  horses: Horse[]
  drugs: Drug[]
  vetName: string
  itemCodes?: CatalogItem[]
  initialSelectedItemCodeIds?: string[]
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
    hasta_cuando?: string | null
    notas?: string
    vet_autorizado_nombre?: string
  }
  mode?: 'create' | 'edit'
  onSuccess?: () => void
  createAction?: typeof createTreatmentReport | typeof createPMFRecord
  updateAction?: typeof updateTreatmentReport | typeof updatePMFRecord
}

export default function TreatmentReportForm({
  horses,
  drugs,
  vetName,
  itemCodes = [],
  initialSelectedItemCodeIds = [],
  defaultValues,
  mode = 'create',
  onSuccess,
  createAction = createTreatmentReport,
  updateAction = updateTreatmentReport,
}: TreatmentReportFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedDrugId, setSelectedDrugId] = useState<string>(defaultValues?.drug_id ?? '')
  const [withdrawalTime, setWithdrawalTime] = useState<string>(defaultValues?.tiempo_restriccion?.toString() ?? '')
  const [fechaFin, setFechaFin] = useState<string>('')
  const [horaFin, setHoraFin] = useState<string>('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formDataToSubmit, setFormDataToSubmit] = useState<FormData | null>(null)

  // Get unique categories from drugs
  const categories = Array.from(new Set(drugs.map(d => d.categoria).filter(Boolean)))

  // Filter drugs by selected category
  const filteredDrugs = selectedCategory ? drugs.filter(d => d.categoria === selectedCategory) : drugs

  const selectedDrug = drugs.find(d => d.id === selectedDrugId)
  const tieneRestriccion = selectedDrug?.tipo_restriccion != null

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

  // Update withdrawal time when drug changes
  useEffect(() => {
    if (selectedDrug?.withdrawal_time_horas) {
      setWithdrawalTime(selectedDrug.withdrawal_time_horas.toString())
    } else {
      setWithdrawalTime('')
    }
  }, [selectedDrug])

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

  const handleHoraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fecha = formRef.current?.querySelector<HTMLInputElement>('input[name="fecha_tratamiento"]')?.value
    const tiempo = formRef.current?.querySelector<HTMLInputElement>('input[name="tiempo_restriccion"]')?.value
    calcularFechaFin(fecha ?? '', tiempo ? parseInt(tiempo) : null)
  }

  const calcularFechaFin = (fechaStr: string, horas: number | null) => {
    if (!fechaStr || !horas) {
      setFechaFin('')
      setHoraFin('')
      return
    }

    // Get hora_tratamiento from form
    const horaInput = formRef.current?.querySelector<HTMLInputElement>('input[name="hora_tratamiento"]')
    const horaStr = horaInput?.value || '00:00'

    // Parse fecha and hora
    const [year, month, day] = fechaStr.split('-')
    const [horaNum, minNum] = horaStr.split(':')

    // Create date with time
    const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(horaNum), parseInt(minNum))

    // Add hours
    fecha.setHours(fecha.getHours() + horas)

    // Format fecha_fin and hora_fin
    const fechaFinStr = fecha.toISOString().split('T')[0]
    const horaFinStr = fecha.toISOString().split('T')[1].slice(0, 5)

    setFechaFin(fechaFinStr)
    setHoraFin(horaFinStr)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (mode === 'create') {
      // Para crear, mostrar confirmación
      const formData = new FormData(formRef.current!)
      formData.set('vet_autorizado_nombre', vetName)
      setFormDataToSubmit(formData)
      setShowConfirmation(true)
    } else {
      // Para editar, proceder directamente
      const formData = new FormData(formRef.current!)
      formData.set('vet_autorizado_nombre', vetName)

      startTransition(async () => {
        try {
          if (defaultValues?.id) {
            await updateAction(defaultValues.id, formData)
            formRef.current?.reset()
            onSuccess?.()
          }
        } catch (err) {
          console.error(err)
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
        if (redirectUrl) {
          router.push(redirectUrl)
        }
      } catch (err) {
        console.error(err)
        alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
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

      {/* SECCIÓN: ADMINISTRACIÓN DEL MEDICAMENTO */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.primary.green }}>
          Administración del Medicamento
        </h3>

        {/* Categoría y Medicamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
          <div>
            <Label htmlFor="categoria" style={{ color: PALETTE.text.primary }}>Categoría *</Label>
            <select
              id="categoria"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setSelectedDrugId('')
              }}
              required
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm mt-1"
              style={{
                borderColor: PALETTE.ui.border,
                backgroundColor: '#FFFFFF',
                color: PALETTE.text.primary,
              }}
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="drug_id" style={{ color: PALETTE.text.primary }}>Medicamento *</Label>
            <select
              id="drug_id"
              name="drug_id"
              value={selectedDrugId}
              onChange={handleDrugChange}
              required
              disabled={!selectedCategory}
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm mt-1"
              style={{
                borderColor: PALETTE.ui.border,
                backgroundColor: !selectedCategory ? '#F3F4F6' : '#FFFFFF',
                color: PALETTE.text.primary,
                cursor: !selectedCategory ? 'not-allowed' : 'pointer',
                opacity: !selectedCategory ? 0.6 : 1,
              }}
            >
              <option value="">Seleccionar medicamento...</option>
              {filteredDrugs.map(d => (
                <option key={d.id} value={d.id}>
                  {d.nombre} {d.tipo_restriccion ? `(${d.tipo_restriccion})` : ''}
                </option>
              ))}
            </select>
            {selectedDrug && (
              <p className="text-xs mt-2 p-2 rounded" style={{ background: '#f0fdf4', color: PALETTE.text.secondary }}>
                {selectedDrug.tipo_restriccion && <><strong>Tipo de restricción:</strong> {selectedDrug.tipo_restriccion}</>}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha_tratamiento" style={{ color: PALETTE.text.primary }}>Fecha de Tratamiento *</Label>
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
              <Label htmlFor="hora_tratamiento" style={{ color: PALETTE.text.primary }}>Hora de Tratamiento *</Label>
              <Input
                id="hora_tratamiento"
                name="hora_tratamiento"
                type="time"
                defaultValue={defaultValues?.hora_tratamiento ?? ''}
                required
                onChange={handleHoraChange}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dosis" style={{ color: PALETTE.text.primary }}>Dosis *</Label>
            <Input
              id="dosis"
              name="dosis"
              type="number"
              step="0.01"
              defaultValue={defaultValues?.dosis ?? ''}
              required
              placeholder={selectedDrug && selectedDrug.dosis_min !== null && selectedDrug.dosis_max !== null
                ? `Ej: ${selectedDrug.dosis_min}–${selectedDrug.dosis_max}`
                : 'Ej: 500'}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="dosis_unidad" style={{ color: PALETTE.text.primary }}>Unidad *</Label>
            <select
              id="dosis_unidad"
              name="dosis_unidad"
              defaultValue={defaultValues?.dosis_unidad ?? (selectedDrug?.dosis_unidad || 'mg')}
              required
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm mt-1"
              style={{
                borderColor: PALETTE.ui.border,
                backgroundColor: '#FFFFFF',
                color: PALETTE.text.primary,
              }}
            >
              {selectedDrug?.dosis_unidad ? (
                <option value={selectedDrug.dosis_unidad}>{selectedDrug.dosis_unidad}</option>
              ) : (
                <>
                  <option value="mg">mg</option>
                  <option value="ml">ml</option>
                  <option value="cc">cc</option>
                  <option value="g">g</option>
                  <option value="IU">IU</option>
                  <option value="mg/kg">mg/kg</option>
                  <option value="mcg/kg">mcg/kg</option>
                  <option value="g/kg">g/kg</option>
                  <option value="IU/kg">IU/kg</option>
                </>
              )}
            </select>
          </div>

          <div>
            <Label htmlFor="nivel_dosificacion" style={{ color: PALETTE.text.primary }}>Nivel de Dosificación</Label>
            <Input
              id="nivel_dosificacion"
              name="nivel_dosificacion"
              placeholder="Ej: Terapéutico, Profiláctico, etc."
              defaultValue={defaultValues?.nivel_dosificacion ?? ''}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="withdrawal_time" style={{ color: PALETTE.text.primary }}>Retiro Restricción (horas)</Label>
            <Input
              id="withdrawal_time"
              name="tiempo_restriccion"
              type="number"
              value={withdrawalTime}
              onChange={(e) => setWithdrawalTime(e.target.value)}
              placeholder="Auto-completado..."
              readOnly={!!selectedDrug?.withdrawal_time_horas}
              className="mt-1"
              style={{ backgroundColor: selectedDrug?.withdrawal_time_horas ? '#F3F4F6' : '#FFFFFF', opacity: selectedDrug?.withdrawal_time_horas ? 0.7 : 1 }}
            />
            {selectedDrug?.withdrawal_time_dias && (
              <p className="text-xs mt-1" style={{ color: PALETTE.text.secondary }}>
                ≈ {selectedDrug.withdrawal_time_dias} días
              </p>
            )}
          </div>
        </div>

        {/* Info: Medicamento tiene restricción */}
        {tieneRestriccion && (
          <div style={{ padding: '12px 16px', background: '#fffbeb', border: `1px solid #fcd34d`, borderRadius: '8px', marginTop: '16px' }}>
            <p className="text-xs" style={{ color: '#92400e' }}>
              <strong>⚠ Restricción de participación:</strong> Este medicamento requiere {selectedDrug?.withdrawal_time_horas} horas de restricción
            </p>
          </div>
        )}
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
            className="mt-1"
          />
        </div>
      </div>

      {/* Hidden inputs para los valores que no son editable directo */}
      <input type="hidden" name="fecha_fin_tratamiento" value={fechaFin} />
      <input type="hidden" name="hora_fin_tratamiento" value={horaFin} />
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
          {pending ? 'Guardando...' : mode === 'create' ? 'Someter Informe' : 'Actualizar Informe'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
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
