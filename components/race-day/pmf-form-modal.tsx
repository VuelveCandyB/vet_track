'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { createPMFRecord, updatePMFAdministration } from '@/lib/actions/pmf'
import { PMF_CONSTANTS } from '@/lib/types/pmf'

interface PMFFormModalProps {
  open: boolean
  raceEntryId: string
  horseName: string
  postTime: string
  onClose: () => void
  onSuccess?: (pmfRecordId: string) => void
}

type Step = 'receta' | 'administracion'

export default function PMFFormModal({
  open,
  raceEntryId,
  horseName,
  postTime,
  onClose,
  onSuccess,
}: PMFFormModalProps) {
  const [step, setStep] = useState<Step>('receta')
  const [pmfRecordId, setPmfRecordId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Receta form
  const [recetaForm, setRecetaForm] = useState({
    vet_autorizado_nombre: '',
    dosis_recetada: 100,
    hora_entrega_receta: new Date().toISOString(),
  })

  // Administración form
  const [adminForm, setAdminForm] = useState({
    fecha_admin: new Date().toISOString().split('T')[0],
    hora_admin: postTime,
    dosis_administrada: 100,
    aguja_confirmada: false,
  })

  const handleRecetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createPMFRecord({
        raceEntryId,
        dosis_recetada: recetaForm.dosis_recetada,
        hora_entrega_receta: recetaForm.hora_entrega_receta,
        vet_autorizado_nombre: recetaForm.vet_autorizado_nombre,
      })

      if (!result.success) {
        setError(result.error || 'Failed to create PMF record')
        return
      }

      if (result.pmfRecord) {
        setPmfRecordId(result.pmfRecord.id)
        setStep('administracion')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pmfRecordId) return

    setLoading(true)
    setError(null)

    try {
      const result = await updatePMFAdministration({
        pmfRecordId,
        fecha_admin: adminForm.fecha_admin,
        hora_admin: adminForm.hora_admin,
        dosis_administrada: adminForm.dosis_administrada,
        aguja_confirmada: adminForm.aguja_confirmada,
      })

      if (!result.success) {
        setError(result.error || 'Failed to update administration')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.(pmfRecordId)
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'receta' ? 'Receta PMF' : 'Administración PMF'}
          </DialogTitle>
          <DialogDescription>
            Caballo: <strong>{horseName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* RECETA STEP */}
          {step === 'receta' && (
            <form onSubmit={handleRecetaSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vet_name">Veterinario Autorizado</Label>
                <Input
                  id="vet_name"
                  required
                  value={recetaForm.vet_autorizado_nombre}
                  onChange={(e) =>
                    setRecetaForm({
                      ...recetaForm,
                      vet_autorizado_nombre: e.target.value,
                    })
                  }
                  placeholder="Ej: Dr. García"
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosis">
                  Dosis Recetada (mg){' '}
                  <span className="text-xs text-slate-500">
                    ({PMF_CONSTANTS.DOSIS_MIN_MG}-{PMF_CONSTANTS.DOSIS_MAX_MG})
                  </span>
                </Label>
                <Input
                  id="dosis"
                  type="number"
                  min={PMF_CONSTANTS.DOSIS_MIN_MG}
                  max={PMF_CONSTANTS.DOSIS_MAX_MG}
                  value={recetaForm.dosis_recetada}
                  onChange={(e) =>
                    setRecetaForm({
                      ...recetaForm,
                      dosis_recetada: parseInt(e.target.value),
                    })
                  }
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora_entrega">
                  Hora Entrega Receta
                  <span className="text-xs text-slate-500 ml-2">
                    (antes de las {PMF_CONSTANTS.RX_HORA_LIMITE}:00)
                  </span>
                </Label>
                <Input
                  id="hora_entrega"
                  type="datetime-local"
                  value={recetaForm.hora_entrega_receta.slice(0, 16)}
                  onChange={(e) =>
                    setRecetaForm({
                      ...recetaForm,
                      hora_entrega_receta: new Date(e.target.value).toISOString(),
                    })
                  }
                  className="bg-white"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Creando...
                    </>
                  ) : (
                    'Siguiente'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* ADMINISTRACIÓN STEP */}
          {step === 'administracion' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_admin">Fecha Administración</Label>
                <Input
                  id="fecha_admin"
                  type="date"
                  value={adminForm.fecha_admin}
                  onChange={(e) =>
                    setAdminForm({
                      ...adminForm,
                      fecha_admin: e.target.value,
                    })
                  }
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora_admin">Hora Administración</Label>
                <Input
                  id="hora_admin"
                  type="time"
                  value={adminForm.hora_admin}
                  onChange={(e) =>
                    setAdminForm({
                      ...adminForm,
                      hora_admin: e.target.value,
                    })
                  }
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosis_admin">
                  Dosis Administrada (mg){' '}
                  <span className="text-xs text-slate-500">
                    ({PMF_CONSTANTS.DOSIS_MIN_MG}-{PMF_CONSTANTS.DOSIS_MAX_MG})
                  </span>
                </Label>
                <Input
                  id="dosis_admin"
                  type="number"
                  min={PMF_CONSTANTS.DOSIS_MIN_MG}
                  max={PMF_CONSTANTS.DOSIS_MAX_MG}
                  value={adminForm.dosis_administrada}
                  onChange={(e) =>
                    setAdminForm({
                      ...adminForm,
                      dosis_administrada: parseInt(e.target.value),
                    })
                  }
                  className="bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="aguja"
                  type="checkbox"
                  checked={adminForm.aguja_confirmada}
                  onChange={(e) =>
                    setAdminForm({
                      ...adminForm,
                      aguja_confirmada: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
                <label
                  htmlFor="aguja"
                  className="text-sm text-slate-700 cursor-pointer"
                >
                  Aguja confirmada (Art. 1412)
                </label>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    PMF registrado. Ahora necesita firmas.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  onClick={() => setStep('receta')}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Atrás
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Guardando...
                    </>
                  ) : (
                    'Firmar PMF'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
