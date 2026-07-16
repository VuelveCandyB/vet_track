'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import VetlistModal from './vetlist-modal'
import VetlistReleaseModal from './vetlist-release-modal'
import EuthanasiaModal from './euthanasia-modal'
import VaccinationModal from './vaccination-modal'
import { PALETTE } from '@/lib/palette'
import type { Horse, VetlistEntry, Drug } from '@/lib/types'

type ModalType = 'vetlist' | 'release' | 'euthanasia' | 'vaccination' | null

interface Props {
  horse: Horse
  vetlistActiva: VetlistEntry | null
  canEuth: boolean
  isAdmin: boolean
  isOfficialVet: boolean
  vetName: string
  today: string
  drugs: Drug[]
  diasRestantes: number | null
}

export default function HorseActions({
  horse, vetlistActiva, canEuth, isAdmin, isOfficialVet, vetName, today,
  drugs, diasRestantes,
}: Props) {
  const [open, setOpen] = useState<ModalType>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  function closeAndRefresh() {
    setOpen(null)
    router.refresh()
  }

  const isDead = horse.status === 'deceased'

  return (
    <>
      {/* Vetlist banner */}
      {vetlistActiva && (
        <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-4"
          style={{ background: '#2e0d0d', border: '1px solid #f8717160' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#3a1010' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold" style={{ color: '#f87171' }}>CABALLO EN VETLIST</div>
            <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              Ingresó el {vetlistActiva.fecha_ingreso} · Motivo: {vetlistActiva.motivo}
              {vetlistActiva.descripcion && ` · ${vetlistActiva.descripcion}`}
            </div>
            {diasRestantes !== null && (
              <div className="mt-1.5">
                {diasRestantes > 0 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{ color: '#fb923c', background: '#2e1a0d' }}>
                    {diasRestantes} día{diasRestantes !== 1 ? 's' : ''} para poder correr
                  </span>
                )}
                {diasRestantes === 0 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{ color: '#facc15', background: '#2e2a0d' }}>
                    Hoy vence el período de descanso
                  </span>
                )}
                {diasRestantes < 0 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{ color: '#4ade80', background: '#0d2e1a' }}>
                    Período de descanso completado
                  </span>
                )}
              </div>
            )}
          </div>
          <Button onClick={() => setOpen('release')} className="flex-shrink-0 text-sm font-semibold"
            style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
            Liberar de Vetlist
          </Button>
        </div>
      )}

      {/* Action buttons row */}
      {!isDead && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <div className="flex-1" />

          {/* Vetlist button */}
          {!vetlistActiva && (
            <Button onClick={() => setOpen('vetlist')} size="sm"
              className="text-sm font-semibold min-w-fit"
              style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              <svg className="mr-1.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
              Agregar a Vetlist
            </Button>
          )}

          {/* Euthanasia button */}
          {canEuth && (
            <Button onClick={() => setOpen('euthanasia')} size="sm"
              className="text-sm font-semibold min-w-fit"
              style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              Registrar Eutanasia
            </Button>
          )}

          {/* Medication button — now uses treatment reports form */}
          <Link href={`/treatment-reports/new?horse_id=${horse.id}`}>
            <Button size="sm"
              className="text-sm font-semibold min-w-fit"
              style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              Registrar Medicamento
            </Button>
          </Link>

          {/* Vaccination button */}
          <Button onClick={() => setOpen('vaccination')} size="sm"
            className="text-sm font-semibold min-w-fit"
            style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
            Registrar Vacuna
          </Button>
        </div>
      )}

      {/* Modals */}
      <VetlistModal
        open={open === 'vetlist'} onClose={closeAndRefresh}
        horseId={horse.id} horseName={horse.name}
        vetName={vetName} today={today}
      />
      {vetlistActiva && (
        <VetlistReleaseModal
          open={open === 'release'} onClose={closeAndRefresh}
          horseId={horse.id} horseName={horse.name}
          entry={vetlistActiva} vetName={vetName} today={today}
        />
      )}
      <EuthanasiaModal
        open={open === 'euthanasia'} onClose={closeAndRefresh}
        horseId={horse.id} horseName={horse.name}
        vetName={vetName} today={today}
      />
      <VaccinationModal
        open={open === 'vaccination'} onClose={closeAndRefresh}
        horseId={horse.id} horseName={horse.name}
        vetName={vetName} today={today}
      />
    </>
  )
}
