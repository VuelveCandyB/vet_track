'use client'
import { useRef, useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createVaccinations } from '@/lib/actions/vaccinations'
import { PALETTE } from '@/lib/palette'
import type { VaccineType } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  horseId: string
  horseName: string
  vetName: string
  today: string
  vaccineTypes: VaccineType[]
}

interface VaccineRow {
  key: string
  vaccine_type_id: string
  serial_number: string
  notas: string
  fecha_override: string
  changingDate: boolean
}

const SELECT_STYLE = { background: PALETTE.background.white, borderColor: PALETTE.ui.border, color: PALETTE.text.primary }

// Touch-friendly height on phones/tablets, compact on desktop
const CONTROL_CLASS = 'h-10 sm:h-9'

const makeEmptyRow = (): VaccineRow => ({
  key: Math.random().toString(36).substring(7),
  vaccine_type_id: '',
  serial_number: '',
  notas: '',
  fecha_override: '',
  changingDate: false,
})

const LABEL_CLASS = 'text-xs font-semibold uppercase tracking-wider'

export default function VaccinationModal({ open, onClose, horseId, vetName, today, vaccineTypes }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [fecha, setFecha] = useState<string>(today)
  const [rows, setRows] = useState<VaccineRow[]>([makeEmptyRow()])
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const requiredVaccines = vaccineTypes.filter(v => v.required && v.active).sort((a, b) => a.sort_order - b.sort_order)
  const otherVaccines = vaccineTypes.filter(v => !v.required && v.active).sort((a, b) => a.sort_order - b.sort_order)

  function updateRow(key: string, patch: Partial<VaccineRow>) {
    setRows(prev => prev.map(r => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key: string) {
    setRows(prev => (prev.length > 1 ? prev.filter(r => r.key !== key) : prev))
  }

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPdfError(null)
    const file = e.target.files?.[0]

    if (!file) {
      setPdfFile(null)
      return
    }

    if (file.type !== 'application/pdf') {
      setPdfError('Solo se permiten archivos PDF')
      setPdfFile(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setPdfError('El PDF no debe superar 5MB')
      setPdfFile(null)
      return
    }

    setPdfFile(file)
  }

  function resetForm() {
    setRows([makeEmptyRow()])
    setFecha(today)
    setPdfFile(null)
    setPdfError(null)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const formData = new FormData()
    formData.set('fecha', fecha)
    formData.set('vaccinations', JSON.stringify(rows.map(r => ({
      vaccine_type_id: r.vaccine_type_id,
      serial_number: r.serial_number,
      notas: r.notas,
      fecha_override: r.changingDate && r.fecha_override ? r.fecha_override : '',
    }))))
    if (pdfFile) {
      formData.append('pdf', pdfFile)
    }
    startTransition(async () => {
      try {
        await createVaccinations(horseId, formData)
        resetForm()
        onClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al registrar la vacunación')
      }
    })
  }

  const usedIds = new Set(rows.map(r => r.vaccine_type_id).filter(Boolean))
  const submitLabel = pending
    ? 'Guardando...'
    : rows.length > 1
      ? `Registrar ${rows.length} vacunas`
      : 'Registrar Vacuna'

  function renderOptions(list: VaccineType[], currentId: string) {
    return list.map(v => (
      <option key={v.id} value={v.id} disabled={usedIds.has(v.id) && v.id !== currentId}>
        {v.name}
      </option>
    ))
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      {/* Full screen on phones, centered card from sm up */}
      <DialogContent
        className="flex flex-col gap-0 p-0 overflow-hidden h-dvh max-h-dvh w-full max-w-none rounded-none sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-xl"
        style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <DialogHeader className="px-4 pt-4 pb-3 border-b" style={{ borderColor: PALETTE.ui.border }}>
          <DialogTitle style={{ color: PALETTE.text.dark }}>Registro de Vacunación</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
            {/* Shared fields */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={LABEL_CLASS} style={{ color: PALETTE.text.secondary }}>
                  Fecha Vacuna *
                </Label>
                <Input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} className={CONTROL_CLASS} />
              </div>
              <div className="space-y-1.5">
                <Label className={LABEL_CLASS} style={{ color: PALETTE.text.secondary }}>
                  Veterinario
                </Label>
                <Input value={vetName} readOnly className={CONTROL_CLASS} style={{ color: PALETTE.text.secondary, cursor: 'default' }} />
              </div>
            </div>

            {/* Vaccine rows: stacked cards on phones, one compact row on desktop */}
            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div key={row.key}
                  className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end"
                  style={{ borderColor: PALETTE.ui.border }}>
                  <div className="flex items-center justify-between sm:hidden">
                    <span className="text-xs font-semibold" style={{ color: PALETTE.text.secondary }}>
                      Vacuna {idx + 1}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className={LABEL_CLASS} style={{ color: PALETTE.text.secondary }}>
                      Vacuna *
                    </Label>
                    <select
                      required
                      value={row.vaccine_type_id}
                      onChange={e => updateRow(row.key, { vaccine_type_id: e.target.value })}
                      disabled={pending}
                      className={`flex w-full rounded-md border px-3 py-1 text-sm ${CONTROL_CLASS}`}
                      style={SELECT_STYLE}>
                      <option value="" disabled>Seleccionar vacuna...</option>
                      <optgroup label="Requeridas">{renderOptions(requiredVaccines, row.vaccine_type_id)}</optgroup>
                      <optgroup label="Otras">{renderOptions(otherVaccines, row.vaccine_type_id)}</optgroup>
                    </select>
                    {row.vaccine_type_id && (
                      <p className="text-xs" style={{ color: PALETTE.text.secondary }}>
                        Validez: {vaccineTypes.find(v => v.id === row.vaccine_type_id)?.validity_days || 365} días
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className={LABEL_CLASS} style={{ color: PALETTE.text.secondary }}>
                      #Ser
                    </Label>
                    <Input
                      type="text"
                      value={row.serial_number}
                      onChange={e => updateRow(row.key, { serial_number: e.target.value })}
                      disabled={pending}
                      placeholder="Lote (10 car.)"
                      maxLength={10}
                      pattern="[A-Za-z0-9]{0,10}"
                      title="Solo alfanuméricos, máximo 10 caracteres"
                      className={CONTROL_CLASS}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className={LABEL_CLASS} style={{ color: PALETTE.text.secondary }}>
                      Notas
                    </Label>
                    <Input
                      type="text"
                      value={row.notas}
                      onChange={e => updateRow(row.key, { notas: e.target.value })}
                      disabled={pending}
                      placeholder="Opcional"
                      className={CONTROL_CLASS}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => updateRow(row.key, {
                        changingDate: !row.changingDate,
                        fecha_override: row.changingDate ? '' : fecha,
                      })}
                      className="min-h-10 text-xs underline sm:min-h-0 sm:py-1"
                      style={{ color: PALETTE.primary.green }}>
                      {row.changingDate ? 'Usar fecha compartida' : 'Cambiar fecha'}
                    </button>
                    {rows.length > 1 && (
                      <button type="button" onClick={() => removeRow(row.key)} disabled={pending}
                        className="min-h-10 text-xs underline sm:min-h-0 sm:py-1"
                        style={{ color: PALETTE.form.errorText }}>
                        Quitar
                      </button>
                    )}
                  </div>

                  {row.changingDate && (
                    <div className="space-y-1.5 sm:col-span-4">
                      <Label className={LABEL_CLASS} style={{ color: PALETTE.text.secondary }}>
                        Fecha de esta vacuna *
                      </Label>
                      <Input
                        type="date"
                        required
                        value={row.fecha_override}
                        onChange={e => updateRow(row.key, { fecha_override: e.target.value })}
                        disabled={pending}
                        className={`${CONTROL_CLASS} sm:max-w-[12rem]`}
                      />
                    </div>
                  )}
                </div>
              ))}

              <Button type="button" variant="ghost" onClick={() => setRows(prev => [...prev, makeEmptyRow()])}
                disabled={pending} className="h-10 w-full sm:h-9"
                style={{ color: PALETTE.primary.green, border: `1px dashed ${PALETTE.ui.border}` }}>
                + Agregar otra vacuna
              </Button>
            </div>

            {/* Shared PDF */}
            <div className="space-y-1.5">
              <Label className={LABEL_CLASS} style={{ color: PALETTE.text.secondary }}>
                Certificado PDF (Opcional, aplica a todas)
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfChange}
                disabled={pending}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={pending}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md border px-3 text-sm transition-colors sm:h-9"
                style={{
                  background: pdfFile ? PALETTE.primary.green : PALETTE.background.white,
                  borderColor: PALETTE.ui.border,
                  color: pdfFile ? '#FFFFFF' : PALETTE.text.primary,
                }}>
                <span>{pdfFile ? 'Archivo seleccionado' : 'Seleccionar PDF'}</span>
              </button>
              {pdfFile && (
                <p className="text-xs break-all" style={{ color: PALETTE.text.secondary }}>
                  {pdfFile.name}
                </p>
              )}
              {pdfError && (
                <p className="text-xs" style={{ color: PALETTE.form.errorText }}>
                  {pdfError}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2.5"
                style={{ background: PALETTE.form.errorBg, border: `1px solid ${PALETTE.form.errorBorder}` }}>
                <p className="text-xs leading-relaxed" style={{ color: PALETTE.form.errorText }}>{error}</p>
              </div>
            )}
          </div>

          {/* Sticky action bar: always reachable on phones */}
          <div className="flex gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            style={{ borderColor: PALETTE.ui.border, background: PALETTE.background.white }}>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending} className="h-10 sm:h-9">
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} className="h-10 flex-1 sm:h-9"
              style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
