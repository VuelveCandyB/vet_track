'use client'
import { useRef, useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createVaccination } from '@/lib/actions/vaccinations'
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

const SELECT_STYLE = { background: PALETTE.background.white, borderColor: PALETTE.ui.border, color: PALETTE.text.primary }

export default function VaccinationModal({ open, onClose, horseId, horseName, vetName, today, vaccineTypes }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [selectedVaccineId, setSelectedVaccineId] = useState<string>('')
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPdfError(null)
    const file = e.target.files?.[0]

    if (!file) {
      setPdfFile(null)
      return
    }

    // Validar tipo
    if (file.type !== 'application/pdf') {
      setPdfError('Solo se permiten archivos PDF')
      setPdfFile(null)
      return
    }

    // Validar tamaño (5MB = 5242880 bytes)
    if (file.size > 5 * 1024 * 1024) {
      setPdfError('El PDF no debe superar 5MB')
      setPdfFile(null)
      return
    }

    setPdfFile(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(formRef.current!)
    if (pdfFile) {
      formData.append('pdf', pdfFile)
    }
    startTransition(async () => {
      try {
        await createVaccination(horseId, formData)
        onClose()
      } catch (err: any) {
        setError(err?.message || 'Error al registrar la vacunación')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg"
        style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: PALETTE.text.dark }}>Registro de Vacunación</DialogTitle>
          <p className="text-xs" style={{ color: PALETTE.text.secondary }}>{horseName}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Vacuna *
              </Label>
              <select
                name="vaccine_type_id"
                required
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={SELECT_STYLE}
                onChange={(e) => setSelectedVaccineId(e.target.value)}>
                <option value="" disabled>Seleccionar vacuna...</option>
                <optgroup label="Requeridas">
                  {vaccineTypes.filter(v => v.required && v.active).sort((a, b) => a.sort_order - b.sort_order).map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Otras">
                  {vaccineTypes.filter(v => !v.required && v.active).sort((a, b) => a.sort_order - b.sort_order).map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </optgroup>
              </select>
              {selectedVaccineId && (
                <p className="text-xs" style={{ color: PALETTE.text.secondary }}>
                  Validez: {vaccineTypes.find(v => v.id === selectedVaccineId)?.validity_days || 365} días
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Fecha Vacuna *
              </Label>
              <Input type="date" name="fecha" required defaultValue={today} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              #Ser (10 caracteres)
            </Label>
            <Input
              type="text"
              name="serial_number"
              placeholder="Número de serie del lote"
              maxLength={10}
              pattern="[A-Za-z0-9]{0,10}"
              title="Solo alfanuméricos, máximo 10 caracteres"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              Veterinario
            </Label>
            <Input value={vetName} readOnly style={{ color: PALETTE.text.secondary, cursor: 'default' }} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              Notas adicionales
            </Label>
            <Textarea name="notas" rows={2} placeholder="Notas opcionales..." />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
              Certificado PDF (Opcional)
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
              className="w-full flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors"
              style={{
                background: pdfFile ? PALETTE.primary.green : PALETTE.background.white,
                borderColor: PALETTE.ui.border,
                color: pdfFile ? '#FFFFFF' : PALETTE.text.primary,
              }}>
              <span>{pdfFile ? '✓ Archivo seleccionado' : '📄 Seleccionar PDF'}</span>
            </button>
            {pdfFile && (
              <p className="text-xs" style={{ color: PALETTE.text.secondary }}>
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

          <div className="flex gap-3">
            <Button type="submit" disabled={pending} className="flex-1"
              style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              {pending ? 'Guardando...' : 'Registrar Vacuna'}
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
