'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { deleteTreatmentReport } from '@/lib/actions/treatment-reports'
import { PALETTE } from '@/lib/palette'

const MIN_RAZON = 10

interface DeleteReportDialogProps {
  reportId: string
  horseId?: string | null
}

export default function DeleteReportDialog({ reportId, horseId }: DeleteReportDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [razon, setRazon] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const restantes = Math.max(0, MIN_RAZON - razon.trim().length)
  const valida = restantes === 0

  const handleOpenChange = (next: boolean) => {
    if (isPending) return
    setOpen(next)
    if (!next) {
      setRazon('')
      setError(null)
    }
  }

  const handleDelete = () => {
    if (!valida) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteTreatmentReport(reportId, razon)
        setOpen(false)
        router.replace(horseId ? `/horses/${horseId}` : '/treatment-reports')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo eliminar el informe')
      }
    })
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        style={{ borderColor: PALETTE.status.error, color: PALETTE.status.error }}
      >
        Eliminar
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar informe de tratamiento</DialogTitle>
            <DialogDescription>
              Se eliminará el informe con todos sus medicamentos. Queda registrado con tu razón y aparece en el correo diario de eliminaciones. Solo se puede eliminar mientras el informe no esté revisado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label htmlFor="razon-eliminacion" className="text-xs font-medium" style={{ color: PALETTE.text.primary }}>
              Razón de la eliminación *
            </label>
            <Textarea
              id="razon-eliminacion"
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              placeholder="Explica por qué se elimina este informe (por ejemplo: registrado dos veces, medicamento equivocado)"
              className="min-h-[100px] resize-none"
              disabled={isPending}
            />
            <p className="text-xs" style={{ color: PALETTE.text.secondary }}>
              {valida
                ? 'Listo para eliminar.'
                : `Faltan ${restantes} caracteres (mínimo ${MIN_RAZON}).`}
            </p>
          </div>

          {error && (
            <div
              className="rounded-md p-3 text-sm"
              style={{ background: PALETTE.form.errorBg, color: PALETTE.status.error }}
            >
              {error}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!valida || isPending}
              style={{ background: PALETTE.status.error, color: '#fff' }}
            >
              {isPending ? 'Eliminando...' : 'Eliminar informe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
