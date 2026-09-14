'use client'
import { useRef, useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createVetlistEntry } from '@/lib/actions/vetlist'
import { PALETTE } from '@/lib/palette'
import type { HorseReferido } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  horseId: string
  horseName: string
  vetName: string
  today: string
  activeReferido: HorseReferido | null
}

export default function VetlistModal({ open, onClose, horseId, horseName, vetName, today, activeReferido }: Props) {
  const [pending, startTransition] = useTransition()
  const [fileName, setFileName] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  if (!activeReferido) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData(formRef.current!)
    startTransition(async () => {
      await createVetlistEntry(horseId, formData)
      formRef.current?.reset()
      setFileName('')
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: PALETTE.text.dark }}>
            Approve to Vetlist
          </DialogTitle>
          <p className="text-xs" style={{ color: PALETTE.text.secondary }}>{horseName}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Referido summary */}
          {activeReferido && (
            <>
              <div className="rounded-lg px-4 py-3" style={{ background: PALETTE.background.lightAlt }}>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold" style={{ color: PALETTE.text.secondary }}>Reason: </span>
                    <span style={{ color: PALETTE.text.primary }}>{activeReferido.motivo}</span>
                  </div>
                  {activeReferido.extremidad && (
                    <div>
                      <span className="font-semibold" style={{ color: PALETTE.text.secondary }}>Limb: </span>
                      <span style={{ color: PALETTE.text.primary }}>{activeReferido.extremidad}</span>
                    </div>
                  )}
                  {activeReferido.grado && (
                    <div>
                      <span className="font-semibold" style={{ color: PALETTE.text.secondary }}>Grade: </span>
                      <span style={{ color: PALETTE.text.primary }}>{activeReferido.grado}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold" style={{ color: PALETTE.text.secondary }}>Eligible to Work: </span>
                    <span style={{ color: PALETTE.text.primary }}>{activeReferido.elegible_trabajar ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: PALETTE.text.secondary }}>Testing Required: </span>
                    <span style={{ color: PALETTE.text.primary }}>{activeReferido.requiere_pruebas ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: PALETTE.text.secondary }}>Claim Voided: </span>
                    <span style={{ color: PALETTE.text.primary }}>{activeReferido.reclamo_anulado ? 'Yes' : 'No'}</span>
                  </div>
                  {activeReferido.persona_responsable && (
                    <div>
                      <span className="font-semibold" style={{ color: PALETTE.text.secondary }}>Responsible Person: </span>
                      <span style={{ color: PALETTE.text.primary }}>{activeReferido.persona_responsable}</span>
                    </div>
                  )}
                  {activeReferido.tipo_contacto && (
                    <div>
                      <span className="font-semibold" style={{ color: PALETTE.text.secondary }}>Contact Type: </span>
                      <span style={{ color: PALETTE.text.primary }}>{activeReferido.tipo_contacto}</span>
                    </div>
                  )}
                  {activeReferido.contacto && (
                    <div>
                      <span className="font-semibold" style={{ color: PALETTE.text.secondary }}>Contact: </span>
                      <span style={{ color: PALETTE.text.primary }}>{activeReferido.contacto}</span>
                    </div>
                  )}
                </div>
              </div>
              <input type="hidden" name="referido_id" value={activeReferido.id} />
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Admission Date *
              </Label>
              <Input type="date" name="fecha_ingreso" required defaultValue={today} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Veterinarian
              </Label>
              <Input value={vetName} readOnly style={{ color: PALETTE.text.secondary, cursor: 'default' }} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Additional Notes <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(optional)</span>
              </Label>
              <Textarea name="descripcion" rows={3}
                placeholder="Official vet notes, clinical observations..." />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Rest Start <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(optional)</span>
              </Label>
              <Input type="date" name="fecha_inicio_descanso" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Rest End <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(optional)</span>
              </Label>
              <Input type="date" name="fecha_fin_descanso" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Attachment <span className="font-normal normal-case" style={{ color: '#4a5280' }}>(PDF or image · max 10 MB)</span>
              </Label>
              <label className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer"
                style={{ background: PALETTE.background.lightAlt, border: `1px dashed ${PALETTE.ui.border}` }}>
                <span>📎</span>
                <span className="text-sm" style={{ color: PALETTE.text.secondary }}>
                  {fileName || 'Select file...'}
                </span>
                <input type="file" name="attachment" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                  className="hidden"
                  onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
              </label>
            </div>
          </div>

          <div className="rounded-lg px-3 py-2.5 flex gap-2.5"
            style={{ background: '#2e0d0d', border: '1px solid #f8717140' }}>
            <span className="flex-shrink-0">⚠️</span>
            <p className="text-xs leading-relaxed" style={{ color: '#f87171' }}>
              Adding this horse to vetlist will disable it for racing until a veterinarian releases it.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={pending} className="flex-1"
              style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              {pending ? 'Saving...' : 'Approve to Vetlist'}
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
