'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { RaceEntry } from '@/lib/types/pmf'
import AssignHorseModal from './assign-horse-modal'
import { getPMFStatusBatch } from '@/lib/actions/pmf'

interface RaceEntriesTableProps {
  entries: RaceEntry[]
  raceDayId: string
  onSuccess?: () => void
}

export function RaceEntriesTable({
  entries,
  raceDayId,
  onSuccess,
}: RaceEntriesTableProps) {
  const router = useRouter()
  const [assigningEntryId, setAssigningEntryId] = useState<string | null>(null)
  const [pmfStatus, setPMFStatus] = useState<Record<string, string>>({})

  // Load PMF status for all entries in a single batch query
  useEffect(() => {
    const loadPMFStatus = async () => {
      const entryIds = entries.map(e => e.id)
      const result = await getPMFStatusBatch(entryIds)
      if (result.success) {
        setPMFStatus(result.statuses)
      }
    }
    if (entries.length > 0) {
      loadPMFStatus()
    }
  }, [entries.length])


  // Separate matched and unmatched
  const matched = entries.filter(
    (e) => e.match_status === 'matched' || e.match_status === 'manual'
  )
  const unmatched = entries.filter((e) => e.match_status === 'unmatched')

  // Group matched by carrera
  const matchedByCarrera = matched.reduce(
    (acc, entry) => {
      const carrera = entry.num_carrera
      if (!acc[carrera]) {
        acc[carrera] = []
      }
      acc[carrera].push(entry)
      return acc
    },
    {} as Record<number, RaceEntry[]>
  )

  // Group unmatched by carrera
  const unmatchedByCarrera = unmatched.reduce(
    (acc, entry) => {
      const carrera = entry.num_carrera
      if (!acc[carrera]) {
        acc[carrera] = []
      }
      acc[carrera].push(entry)
      return acc
    },
    {} as Record<number, RaceEntry[]>
  )

  return (
    <div className="space-y-6">
      {/* Matched Section - Grouped by Carrera */}
      {matched.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Caballos Vinculados ({matched.length})
            </h3>
            <Badge className="bg-green-100 text-green-800 border-green-300 border">
              ✓
            </Badge>
          </div>
          <Accordion type="single" collapsible className="border rounded-lg">
            {Object.entries(matchedByCarrera)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([carrera, entries]) => (
                <AccordionItem key={carrera} value={`matched-${carrera}`} className="border-b last:border-b-0">
                  <AccordionTrigger className="bg-slate-50 hover:bg-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-slate-900">Carrera {carrera}</span>
                      <Badge className="bg-green-100 text-green-800 border-green-300 border text-xs">
                        {entries.length} caballo{entries.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Caballo</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Hora</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Entrenador</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Dueño</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Match</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">PMF</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry) => (
                            <tr key={entry.id} className="border-b hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-900 font-medium">{entry.horse_nombre_csv}</td>
                              <td className="px-4 py-3 text-slate-600">{entry.hora_salida}</td>
                              <td className="px-4 py-3 text-slate-600">{entry.trainer || '—'}</td>
                              <td className="px-4 py-3 text-slate-600">{entry.owner || '—'}</td>
                              <td className="px-4 py-3">
                                <Badge
                                  className={`${
                                    entry.match_status === 'manual'
                                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                                      : 'bg-green-100 text-green-800 border-green-300'
                                  } border text-xs`}
                                >
                                  {entry.match_status === 'manual' ? 'Asignado Manual' : 'Matched Auto'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {pmfStatus[entry.id] === 'certificado' ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-300 border text-xs">
                                    ✓ Certificado
                                  </Badge>
                                ) : pmfStatus[entry.id] === 'borrador' ? (
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 border text-xs">
                                    ◐ Registrado
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-800 border-slate-300 border text-xs">
                                    ○ Sin registrar
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => router.push(`/pmf/${raceDayId}_${entry.id}`)}
                                  className="text-xs text-slate-600 hover:text-slate-900"
                                >
                                  PMF →
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </div>
      )}

      {/* Unmatched Section - Grouped by Carrera */}
      {unmatched.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-red-900">
              Caballos Sin Vincular ({unmatched.length})
            </h3>
            <Badge className="bg-red-100 text-red-800 border-red-300 border">
              ⚠️
            </Badge>
          </div>
          <Accordion type="single" collapsible className="border border-red-200 rounded-lg bg-red-50">
            {Object.entries(unmatchedByCarrera)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([carrera, entries]) => (
                <AccordionItem key={carrera} value={`unmatched-${carrera}`} className="border-b border-red-200 last:border-b-0">
                  <AccordionTrigger className="bg-red-100 hover:bg-red-200">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-red-900">Carrera {carrera}</span>
                      <Badge className="bg-red-300 text-red-900 border-red-400 border text-xs">
                        {entries.length} caballo{entries.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-red-100 border-b border-red-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-red-900">Caballo (CSV)</th>
                            <th className="px-4 py-3 text-left font-semibold text-red-900">Horse ID</th>
                            <th className="px-4 py-3 text-left font-semibold text-red-900">Hora</th>
                            <th className="px-4 py-3 text-left font-semibold text-red-900">PMF</th>
                            <th className="px-4 py-3 text-left font-semibold text-red-900">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry) => (
                            <tr key={entry.id} className="border-b border-red-200 hover:bg-red-100">
                              <td className="px-4 py-3 text-red-900 font-medium">{entry.horse_nombre_csv}</td>
                              <td className="px-4 py-3 font-mono text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                                {entry.horse_id_csv}
                              </td>
                              <td className="px-4 py-3 text-red-700">{entry.hora_salida}</td>
                              <td className="px-4 py-3">
                                {pmfStatus[entry.id] === 'certificado' ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-300 border text-xs">
                                    ✓ Certificado
                                  </Badge>
                                ) : pmfStatus[entry.id] === 'borrador' ? (
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 border text-xs">
                                    ◐ Registrado
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-800 border-slate-300 border text-xs">
                                    ○ Sin registrar
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  onClick={() => setAssigningEntryId(entry.id)}
                                  className="text-xs bg-red-600 text-white hover:bg-red-700"
                                >
                                  Asignar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </div>
      )}

      {/* Assign Modal */}
      {assigningEntryId && (
        <AssignHorseModal
          open={!!assigningEntryId}
          entryId={assigningEntryId}
          horseNameCSV={
            unmatched.find((e) => e.id === assigningEntryId)?.horse_nombre_csv ||
            ''
          }
          onClose={() => {
            setAssigningEntryId(null)
            onSuccess?.()
          }}
        />
      )}

      {/* Empty State */}
      {entries.length === 0 && (
        <div className="text-center py-12 text-slate-600">
          No hay caballos en este día de carreras aún. Sube un CSV para empezar.
        </div>
      )}
    </div>
  )
}
