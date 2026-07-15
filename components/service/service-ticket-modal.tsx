'use client'

import React, { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createServiceTicket } from '@/lib/actions/service-tickets'
import { PALETTE } from '@/lib/palette'
import { Spinner } from '@/components/ui/spinner'

const SELECT_STYLE = {
  background: PALETTE.background.white,
  borderColor: PALETTE.ui.border,
  color: PALETTE.text.primary,
}

const SITUACIONES = [
  'Error al registrar medicamento',
  'Problema con vetlist',
  'Caballo no aparece',
  'Problema de acceso/login',
  'Otro',
]

interface ServiceTicketModalProps {
  open: boolean
  onClose: () => void
  vetName: string
  vetEmail: string
}

export function ServiceTicketModal({
  open,
  onClose,
  vetName,
  vetEmail,
}: ServiceTicketModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const formRef = React.useRef<HTMLFormElement>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!formRef.current) return

    startTransition(async () => {
      try {
        const formData = new FormData(formRef.current!)
        const result = await createServiceTicket(formData)

        if (result.success) {
          setSuccess(true)
          setTimeout(() => {
            formRef.current?.reset()
            setSuccess(false)
            onClose()
          }, 2000)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear ticket')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar un Problema</DialogTitle>
          <DialogDescription>
            Cuéntanos qué está sucediendo para que podamos ayudarte.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-4">
            <div
              className="flex items-center gap-2 rounded-md p-3"
              style={{ background: PALETTE.form.successBg }}
            >
              <span className="text-lg">✓</span>
              <p style={{ color: PALETTE.status.success }}>
                Ticket enviado exitosamente. ¡Gracias por reportar!
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} ref={formRef} className="space-y-4 py-4">
            {/* Vet Name (read-only) */}
            <div className="space-y-1">
              <Label htmlFor="vet_name" className="text-xs font-medium">
                Veterinario
              </Label>
              <input
                id="vet_name"
                type="text"
                value={vetName}
                readOnly
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm opacity-60 cursor-not-allowed"
                style={{ ...SELECT_STYLE }}
              />
            </div>

            {/* Vet Email (read-only) */}
            <div className="space-y-1">
              <Label htmlFor="vet_email" className="text-xs font-medium">
                Email
              </Label>
              <input
                id="vet_email"
                type="email"
                value={vetEmail}
                readOnly
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm opacity-60 cursor-not-allowed"
                style={{ ...SELECT_STYLE }}
              />
            </div>

            {/* Situacion */}
            <div className="space-y-1">
              <Label htmlFor="situacion" className="text-xs font-medium">
                Situación *
              </Label>
              <select
                id="situacion"
                name="situacion"
                required
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={SELECT_STYLE}
              >
                <option value="" disabled>
                  Seleccionar...
                </option>
                {SITUACIONES.map((sit) => (
                  <option key={sit} value={sit}>
                    {sit}
                  </option>
                ))}
              </select>
            </div>

            {/* Detalle */}
            <div className="space-y-1">
              <Label htmlFor="detalle" className="text-xs font-medium">
                Detalle *
              </Label>
              <Textarea
                id="detalle"
                name="detalle"
                placeholder="Describe el problema con el mayor detalle posible..."
                required
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                className="flex items-center gap-2 rounded-md p-3 text-sm"
                style={{
                  background: PALETTE.form.errorBg,
                  color: PALETTE.status.error,
                }}
              >
                <span>!</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Ticket'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
