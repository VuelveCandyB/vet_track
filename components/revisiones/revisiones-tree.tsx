'use client'
import { useState } from 'react'
import { PALETTE } from '@/lib/palette'
import ReviewMedicationButton from './review-medication-button'

interface MedicationRow {
  id: string
  treatment_report_id: string
  dosis: number
  dosis_unidad: string
  tiempo_restriccion?: number | null
  drug?: { id: string; nombre: string; withdrawal_time_dias?: number }
}

interface TreatmentRow {
  id: string
  fecha_tratamiento: string
  hora_tratamiento: string
  diagnostico: string
  created_by: string
  treatment_report_medications: MedicationRow[]
}

interface HorseGroup {
  horseName: string
  treatments: TreatmentRow[]
  medicationCount: number
}

interface RevisionesTreeProps {
  groups: HorseGroup[]
  tab: string
  technicianMap: Map<string, string>
}

const formatTo12Hour = (timeStr: string | undefined | null) => {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const isAM = hour < 12
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${m} ${isAM ? 'AM' : 'PM'}`
}

export default function RevisionesTree({ groups, tab, technicianMap }: RevisionesTreeProps) {
  const [expandedHorses, setExpandedHorses] = useState<Set<string>>(new Set(groups.map(g => g.horseName)))

  const toggleHorse = (horseName: string) => {
    const newSet = new Set(expandedHorses)
    if (newSet.has(horseName)) {
      newSet.delete(horseName)
    } else {
      newSet.add(horseName)
    }
    setExpandedHorses(newSet)
  }

  return (
    <div className="rounded-lg border overflow-hidden" style={{ background: PALETTE.background.white, borderColor: PALETTE.ui.border }}>
      {/* Header */}
      <div
        className="px-4 py-2.5 border-b text-xs"
        style={{ borderColor: PALETTE.ui.border, color: PALETTE.text.secondary }}>
        {groups.reduce((sum, g) => sum + g.medicationCount, 0)} medicamento{groups.reduce((sum, g) => sum + g.medicationCount, 0) !== 1 ? 's' : ''} en {groups.length} caballo{groups.length !== 1 ? 's' : ''}
      </div>

      {/* Tree */}
      <div>
        {groups.map((group) => {
          const isExpanded = expandedHorses.has(group.horseName)
          return (
            <div key={group.horseName}>
              {/* Horse header row */}
              <div
                className="px-4 py-3 border-b flex items-center justify-between hover:bg-gray-50"
                style={{ borderColor: PALETTE.ui.border }}>
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => toggleHorse(group.horseName)}>
                  <span style={{ color: PALETTE.text.primary }}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <span className="font-semibold" style={{ color: PALETTE.text.primary }}>
                    {group.horseName}
                  </span>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: PALETTE.ui.border, color: PALETTE.text.secondary }}>
                    {group.medicationCount} medicamento{group.medicationCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {tab === 'pendientes' && group.treatments.length > 0 && (
                  <div className="text-right ml-4">
                    <ReviewMedicationButton medId={group.treatments[0].id} />
                  </div>
                )}
              </div>

              {/* Medications rows */}
              {isExpanded && (
                <>
                  {/* Header for medications */}
                  <div
                    className="grid gap-4 px-8 py-2 text-xs"
                    style={{
                      gridTemplateColumns: '140px 100px 90px 130px 100px 120px',
                      background: '#f8fafc',
                      borderBottom: `1px solid ${PALETTE.ui.border}`,
                      color: PALETTE.text.secondary,
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                    <div>Medicamento</div>
                    <div>Dosis</div>
                    <div>Restricción</div>
                    <div>Técnico</div>
                    <div className="text-right">{tab === 'pendientes' ? 'Ingresado' : 'Revisado'}</div>
                    <div>Diagnóstico</div>
                  </div>

                  {/* Medications for this horse */}
                  {group.treatments.flatMap((treatment) =>
                    (treatment.treatment_report_medications ?? []).map((med, medIdx) => (
                      <div
                        key={`${treatment.id}-${med.id}`}
                        className="grid gap-4 px-8 py-3 border-b transition-colors hover:bg-gray-50"
                        style={{
                          gridTemplateColumns: '140px 100px 90px 130px 100px 120px',
                          borderColor: PALETTE.ui.border,
                          alignItems: 'center',
                        }}>
                        <div className="text-sm truncate" style={{ color: PALETTE.text.secondary }}>
                          {med.drug?.nombre ?? '—'}
                        </div>
                        <div className="text-sm truncate" style={{ color: PALETTE.text.secondary }}>
                          {med.dosis ? `${med.dosis} ${med.dosis_unidad || 'mg'}` : '—'}
                        </div>
                        <div className="text-sm" style={{ color: PALETTE.text.secondary }}>
                          {med.tiempo_restriccion ? (
                            <div>
                              <div>{med.tiempo_restriccion}h</div>
                              <div className="text-xs">{med.drug?.withdrawal_time_dias || '—'}d</div>
                            </div>
                          ) : '—'}
                        </div>
                        <div className="text-sm truncate" style={{ color: PALETTE.text.secondary }}>
                          {technicianMap.get(treatment.created_by) ?? '—'}
                        </div>
                        <div className="text-sm text-right" style={{ color: PALETTE.text.primary }}>
                          {tab === 'pendientes'
                            ? (treatment.fecha_tratamiento && treatment.hora_tratamiento
                                ? `${treatment.fecha_tratamiento.slice(5, 10)} ${formatTo12Hour(treatment.hora_tratamiento)}`
                                : '—')
                            : '—'}
                        </div>
                        <div className="text-sm truncate text-xs" style={{ color: PALETTE.text.secondary }}>
                          {treatment.diagnostico ?? '—'}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
