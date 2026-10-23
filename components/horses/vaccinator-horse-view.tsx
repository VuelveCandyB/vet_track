'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import VaccinationModal from './vaccination-modal'
import VaccinationPdfButton from './vaccination-pdf-button'
import { STATUS_LABEL } from '@/lib/constants'
import { PALETTE } from '@/lib/palette'
import type { Horse, Vaccination, VaccineType } from '@/lib/types'

interface Props {
  horse: Horse
  vaccineTypes: VaccineType[]
  vaccinations: Vaccination[]
  vetName: string
  today: string
}

function vaccineStatus(vt: VaccineType, lastVac: Vaccination | undefined) {
  if (!lastVac) return { label: 'No aplicada', color: PALETTE.text.secondary }

  const vencDate = new Date(new Date(lastVac.fecha).getTime() + vt.validity_days * 24 * 60 * 60 * 1000)
  const daysUntilExpiry = Math.floor((vencDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))

  if (daysUntilExpiry < 0) return { label: 'Vencida', color: '#dc2626' }
  if (daysUntilExpiry <= vt.warning_days) return { label: 'Por Vencer', color: '#f97316' }
  return { label: 'Vigente', color: PALETTE.primary.green }
}

// Minimal horse view for users whose only role is 'vaccinator'.
// Shows header + vaccine status + the vaccination action; nothing else.
export default function VaccinatorHorseView({ horse, vaccineTypes, vaccinations, vetName, today }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const age = horse.birth_date ? `${new Date().getFullYear() - new Date(horse.birth_date).getFullYear()} años` : '—'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-lg p-6" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <h1 className="text-xl font-semibold mb-4" style={{ color: PALETTE.text.dark }}>{horse.name}</h1>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-xs" style={{ color: PALETTE.text.secondary }}>Microchip</dt>
            <dd className="font-mono" style={{ color: PALETTE.text.primary }}>{horse.microchip || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: PALETTE.text.secondary }}>Color</dt>
            <dd style={{ color: PALETTE.text.primary }}>{horse.color || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: PALETTE.text.secondary }}>Género</dt>
            <dd style={{ color: PALETTE.text.primary }}>{horse.gender || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: PALETTE.text.secondary }}>Edad</dt>
            <dd style={{ color: PALETTE.text.primary }}>{age}</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: PALETTE.text.secondary }}>Estado</dt>
            <dd style={{ color: PALETTE.text.primary }}>{STATUS_LABEL[horse.status] ?? horse.status}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg p-6" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: PALETTE.text.dark }}>Vacunas</h2>
          <Button
            onClick={() => setOpen(true)}
            className="text-sm font-semibold min-w-fit"
            style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
            Registrar Vacuna
          </Button>
        </div>

        {vaccineTypes.length === 0 ? (
          <p className="text-sm" style={{ color: PALETTE.text.secondary }}>No hay tipos de vacuna activos.</p>
        ) : vaccineTypes.map(vt => {
          const lastVac = vaccinations.find(v => v.vaccine_type_id === vt.id)
          const status = vaccineStatus(vt, lastVac)
          return (
            <div key={vt.id} className="flex justify-between items-center py-2 text-sm"
              style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
              <span style={{ color: PALETTE.text.secondary }}>{vt.name}</span>
              <div className="flex items-center gap-2">
                {lastVac?.pdf_path && (
                  <VaccinationPdfButton
                    vaccinationId={lastVac.id}
                    pdfPath={lastVac.pdf_path}
                    pdfName={lastVac.pdf_name}
                  />
                )}
                <span style={{ color: status.color, fontWeight: 600 }}>{status.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      <VaccinationModal
        open={open}
        onClose={() => { setOpen(false); router.refresh() }}
        horseId={horse.id}
        horseName={horse.name}
        vetName={vetName}
        today={today}
        vaccineTypes={vaccineTypes}
      />
    </div>
  )
}
