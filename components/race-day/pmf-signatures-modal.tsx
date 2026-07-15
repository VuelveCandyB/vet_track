'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  signPMFAsVetOficial,
  signPMFAsRepresentante,
  certifyPMFRecord,
} from '@/lib/actions/pmf'

interface PMFSignaturesModalProps {
  open: boolean
  pmfRecordId: string
  horseName: string
  vetOfficialName?: string
  vetOfficialSigned?: boolean
  representanteName?: string
  representanteSigned?: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function PMFSignaturesModal({
  open,
  pmfRecordId,
  horseName,
  vetOfficialName,
  vetOfficialSigned,
  representanteName,
  representanteSigned,
  onClose,
  onSuccess,
}: PMFSignaturesModalProps) {
  const { user } = useAuth()
  const [repName, setRepName] = useState(representanteName || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [signingAs, setSigningAs] = useState<'vet' | 'rep' | null>(null)
  const [certifying, setCertifying] = useState(false)

  const handleSignAsVet = async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError(null)
    setSigningAs('vet')

    try {
      const result = await signPMFAsVetOficial(
        pmfRecordId,
        user.id,
        user.email || 'Unknown'
      )

      if (!result.success) {
        setError(result.error || 'Failed to sign')
        return
      }

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setSigningAs(null)
    }
  }

  const handleSignAsRep = async () => {
    if (!repName.trim()) {
      setError('Ingresa el nombre del representante')
      return
    }

    setLoading(true)
    setError(null)
    setSigningAs('rep')

    try {
      const result = await signPMFAsRepresentante(
        pmfRecordId,
        repName
      )

      if (!result.success) {
        setError(result.error || 'Failed to sign')
        return
      }

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setSigningAs(null)
    }
  }

  const handleCertify = async () => {
    setCertifying(true)
    setError(null)

    try {
      const result = await certifyPMFRecord(pmfRecordId)

      if (!result.success) {
        setError(result.error || 'Failed to certify')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCertifying(false)
    }
  }

  const bothSigned = vetOfficialSigned && representanteSigned

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Firmas PMF</DialogTitle>
          <DialogDescription>
            Caballo: <strong>{horseName}</strong> (Art. 1412c)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vet Oficial Signature */}
          <div className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-900">
                Vet Oficial
              </label>
              {vetOfficialSigned ? (
                <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Firmado
                </span>
              ) : (
                <span className="text-xs font-bold text-red-600">Pendiente</span>
              )}
            </div>
            {vetOfficialSigned ? (
              <div className="text-sm text-slate-600">{vetOfficialName}</div>
            ) : (
              <Button
                onClick={handleSignAsVet}
                disabled={loading || signingAs === 'rep'}
                className="w-full text-sm"
              >
                {signingAs === 'vet' && loading ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Firmando...
                  </>
                ) : (
                  'Firmar como Vet Oficial'
                )}
              </Button>
            )}
          </div>

          {/* Representante Signature */}
          <div className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-900">
                Representante
              </label>
              {representanteSigned ? (
                <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Firmado
                </span>
              ) : (
                <span className="text-xs font-bold text-red-600">Pendiente</span>
              )}
            </div>
            {representanteSigned ? (
              <div className="text-sm text-slate-600">{representanteName}</div>
            ) : (
              <>
                <Input
                  placeholder="Nombre del representante"
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  className="mb-2 bg-white"
                  disabled={loading}
                />
                <Button
                  onClick={handleSignAsRep}
                  disabled={loading || signingAs === 'vet' || !repName.trim()}
                  className="w-full text-sm"
                >
                  {signingAs === 'rep' && loading ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Firmando...
                    </>
                  ) : (
                    'Firmar como Representante'
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Status */}
          {bothSigned ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Ambas firmas completas. Puedes certificar.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Se requieren 2 firmas: Vet Oficial + Representante
              </AlertDescription>
            </Alert>
          )}

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
                PMF certificado exitosamente
              </AlertDescription>
            </Alert>
          )}

          {/* Certify Button */}
          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cerrar
            </Button>
            <Button
              onClick={handleCertify}
              disabled={!bothSigned || certifying}
              className="flex-1"
            >
              {certifying ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Certificando...
                </>
              ) : (
                'Certificar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
