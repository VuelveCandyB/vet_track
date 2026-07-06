'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, Calendar, Plus } from 'lucide-react'
import { getAllRaceDays } from '@/lib/actions/race-day'
import { RaceDay } from '@/lib/types/pmf'

type FilterType = 'todos' | 'proximos' | 'activos' | 'pasados'

export function RaceDaysList() {
  const [raceDays, setRaceDays] = useState<
    Array<RaceDay & { entry_count: number; matched_count: number }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('todos')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await getAllRaceDays()
      if (result.success && result.raceDays) {
        setRaceDays(result.raceDays)
      } else {
        setError(result.error || 'Failed to load race days')
      }
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toISOString().split('T')[0]

  const filteredRaceDays = raceDays.filter((rd) => {
    switch (filter) {
      case 'proximos':
        return rd.fecha > today
      case 'activos':
        return rd.estado === 'activo'
      case 'pasados':
        return rd.fecha < today
      case 'todos':
      default:
        return true
    }
  })

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { color: string; label: string }
    > = {
      borrador: {
        color: 'bg-slate-100 text-slate-800 border-slate-300',
        label: 'Borrador',
      },
      activo: {
        color: 'bg-green-100 text-green-800 border-green-300',
        label: 'Activo',
      },
      cerrado: {
        color: 'bg-red-100 text-red-800 border-red-300',
        label: 'Cerrado',
      },
    }
    const s = statusMap[status] || statusMap.borrador
    return <Badge className={`${s.color} border`}>{s.label}</Badge>
  }

  const getSourceBadge = (source: string) => {
    const sourceMap: Record<string, string> = {
      equibase: 'Equibase',
      csv: 'CSV Upload',
      manual: 'Manual',
    }
    return sourceMap[source] || source
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-slate-700">Filtrar por:</span>
        {(['todos', 'proximos', 'activos', 'pasados'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              filter === f
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
            }`}
          >
            {f === 'todos'
              ? 'Todos'
              : f === 'proximos'
                ? 'Próximos'
                : f === 'activos'
                  ? 'Activos'
                  : 'Pasados'}
          </button>
        ))}
      </div>

      {filteredRaceDays.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <div className="text-slate-600 mb-4">No hay días de carreras en esta categoría</div>
            <Link href="/race-day/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Nuevo
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRaceDays.map((rd) => {
            const isToday = rd.fecha === today
            const isPast = rd.fecha < today
            const isFuture = rd.fecha > today

            return (
              <Link key={rd.id} href={`/race-day/${rd.id}`}>
                <Card className="hover:border-green-300 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Date & Status */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold text-slate-900">
                            {new Date(rd.fecha + 'T00:00:00').toLocaleDateString('es-PR', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          {isToday && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300 border">
                              HOY
                            </Badge>
                          )}
                          {getStatusBadge(rd.estado)}
                        </div>
                        <div className="text-sm text-slate-600">
                          {rd.hora_retiros && `Retiros: ${rd.hora_retiros}`}
                          {rd.total_carreras && ` · ${rd.total_carreras} carreras`}
                          {rd.fuente && ` · Fuente: ${getSourceBadge(rd.fuente)}`}
                        </div>
                      </div>

                      {/* Right: Entry Stats */}
                      <div className="flex items-center gap-6 ml-auto">
                        <div className="text-right">
                          <div className="text-sm text-slate-600">Caballos</div>
                          <div className="text-xl font-bold text-slate-900">
                            {rd.entry_count}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-600">Matched</div>
                          <div className="text-xl font-bold text-green-600">
                            {rd.matched_count}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-600">Sin Match</div>
                          <div className="text-xl font-bold text-red-600">
                            {rd.entry_count - rd.matched_count}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          Ver →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
