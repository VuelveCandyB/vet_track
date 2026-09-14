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

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Solo se permiten imágenes (JPG, PNG, GIF) o PDF')
      setSelectedFile(null)
      return
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      setFileError('El archivo no puede superar 5MB')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  function handleClearFile() {
    setSelectedFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(formRef.current!)
    if (selectedFile) {
      formData.append('archivo', selectedFile)
    }
    startTransition(async () => {
      try {
        await setRedFlag(horseId, formData)
        onClose()
      } catch (err: any) {
        setError(err?.message || 'Error marking referido')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: PALETTE.text.dark }}>Referido</DialogTitle>
          <p className="text-xs" style={{ color: PALETTE.text.secondary }}>{horseName}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Razón (required, full width) */}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Razón *
              </Label>
              <Textarea
                name="reason"
                required
                placeholder="Explica por qué este caballo no es recomendado para carrera..."
                rows={4}
              />
            </div>

            {/* Archivo (optional, full width) */}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Archivo <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(opcional)</span>
              </Label>
              <div className="space-y-2">
                <label
                  className="flex items-center justify-center w-full h-24 rounded-md border-2 border-dashed px-4 py-3 text-sm cursor-pointer transition-colors hover:opacity-80"
                  style={{
                    background: PALETTE.background.white,
                    borderColor: PALETTE.ui.border,
                    color: PALETTE.text.secondary
                  }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    disabled={pending}
                    className="hidden"
                  />
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: PALETTE.text.primary }}>
                      Haz click para seleccionar
                    </p>
                    <p className="text-[11px]" style={{ color: '#4a5280' }}>
                      JPG, PNG, GIF, PDF • Máximo 5MB
                    </p>
                  </div>
                </label>
                {selectedFile && (
                  <div className="flex items-center justify-between p-2 rounded-md" style={{ background: PALETTE.ui.border }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs" style={{ color: PALETTE.text.primary }}>
                        ✓ {selectedFile.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      disabled={pending}
                      className="text-xs px-2 py-1 rounded transition-colors hover:opacity-70"
                      style={{ color: '#dc2626' }}>
                      Limpiar
                    </button>
                  </div>
                )}
                {fileError && (
                  <div className="rounded-lg px-3 py-2.5"
                    style={{ background: PALETTE.form.errorBg, border: `1px solid ${PALETTE.form.errorBorder}` }}>
                    <p className="text-xs leading-relaxed" style={{ color: PALETTE.form.errorText }}>{fileError}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Días de Recomendación */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Días de Recomendación <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(optional)</span>
              </Label>
              <Input
                name="dias_recomendacion"
                type="number"
                min="0"
                placeholder="Ej: 30"
              />
            </div>

            {/* Limb */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Limb <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(optional)</span>
              </Label>
              <select name="extremidad"
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border, color: PALETTE.text.primary }}>
                <option value="">Select...</option>
                {EXTREMIDADES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {/* Grade */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Grade <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(optional)</span>
              </Label>
              <select name="grado"
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border, color: PALETTE.text.primary }}>
                <option value="">Select...</option>
                {GRADOS_REFERIDO.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Eligible to Work */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="elegible_trabajar" className="rounded" />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                  Eligible to Work
                </span>
              </label>
            </div>

            {/* Testing Required */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="requiere_pruebas" className="rounded" />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                  Testing Required
                </span>
              </label>
            </div>

{/* Responsible Person */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Responsible Person <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(optional)</span>
              </Label>
              <Input name="persona_responsable" defaultValue={horseTrainer || ''} placeholder="Name" />
            </div>

            {/* Contact Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Contact Type <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(optional)</span>
              </Label>
              <select name="tipo_contacto"
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border, color: PALETTE.text.primary }}>
                <option value="">Select...</option>
                {TIPOS_CONTACTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Contact */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Contact <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(optional)</span>
              </Label>
              <Input name="contacto" placeholder="Phone or email" />
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
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
