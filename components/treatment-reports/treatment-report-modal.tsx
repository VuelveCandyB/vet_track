'use client'
import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import TreatmentReportForm from './treatment-report-form'
import { PALETTE } from '@/lib/palette'
import type { Horse, Drug, TreatmentReport } from '@/lib/types'

interface TreatmentReportModalProps {
  open: boolean
  onClose: () => void
  horses: Horse[]
  drugs: Drug[]
  vetName: string
  preSelectedHorseId?: string
  defaultValues?: Partial<Omit<TreatmentReport, 'tiempo_restriccion'>> & { id?: string; tiempo_restriccion?: number }
  mode?: 'create' | 'edit'
}

export default function TreatmentReportModal({
  open,
  onClose,
  horses,
  drugs,
  vetName,
  preSelectedHorseId,
  defaultValues,
  mode = 'create',
}: TreatmentReportModalProps) {
  const [, startTransition] = useTransition()

  const handleSuccess = () => {
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nuevo Informe de Tratamiento' : 'Editar Informe'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <TreatmentReportForm
            horses={horses}
            drugs={drugs}
            vetName={vetName}
            defaultValues={
              preSelectedHorseId
                ? { ...defaultValues, horse_id: preSelectedHorseId }
                : defaultValues
            }
            mode={mode}
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
