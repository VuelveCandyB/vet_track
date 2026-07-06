'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, Trash2 } from 'lucide-react'
import { getRaceDayWithEntries, updateRaceDayStatus, deleteRaceEntries } from '@/lib/actions/race-day'
import { RaceDay, RaceEntry } from '@/lib/types/pmf'
import { RaceEntriesTable } from '@/components/race-day/race-entries-table'
import { CSVUpload } from '@/components/race-day/csv-upload'

export default function RaceDayDetailPage() {
  const params = useParams()
  const router = useRouter()
  const raceDayId = params.id as string

  const [raceDay, setRaceDay] = useState<
    (RaceDay & { entries: RaceEntry[] }) | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deletingEntries, setDeletingEntries] = useState(false)

  const loadRaceDay = async () => {
    setLoading(true)
    const result = await getRaceDayWithEntries(raceDayId)
    if (result.success && result.raceDay) {
      setRaceDay(result.raceDay)
    } else {
      setError(result.error || 'Failed to load race day')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRaceDay()
  }, [raceDayId])

  const handleStatusUpdate = async (
    newStatus: 'borrador' | 'activo' | 'cerrado'
  ) => {
    setUpdatingStatus(true)
    const result = await updateRaceDayStatus({
      raceDayId,
      status: newStatus,
    })

    if (result.success) {
      loadRaceDay()
    } else {
      setError(result.error || 'Failed to update status')
    }
    setUpdatingStatus(false)
  }

  const handleDeleteEntries = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar todos los caballos de este día? Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingEntries(true)
    setError(null)
    setSuccess(null)
    const result = await deleteRaceEntries(raceDayId)

    if (result.success) {
      setSuccess('✓ Caballos eliminados exitosamente de la base de datos')
    } else {
      setError(result.error || 'Failed to delete entries')
    }
    setDeletingEntries(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || !raceDay) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Race day not found'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    borrador: 'bg-slate-100 text-slate-800 border-slate-300',
    activo: 'bg-green-100 text-green-800 border-green-300',
    cerrado: 'bg-red-100 text-red-800 border-red-300',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back button */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-slate-600 hover:text-slate-900"
          >
            ← Volver atrás
          </Button>
        </div>

        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">
                Día de Carreras — {new Date(raceDay.fecha + 'T00:00:00').toLocaleDateString('es-PR')}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                {raceDay.hora_retiros && <span>Retiros: {raceDay.hora_retiros}</span>}
                {raceDay.total_carreras && <span>Carreras: {raceDay.total_carreras}</span>}
                <Badge className={`${statusColors[raceDay.estado]} border`}>
                  {raceDay.estado}
                </Badge>
              </div>
            </div>
          </div>

          {/* Status buttons */}
          <div className="flex gap-2">
            {raceDay.estado !== 'borrador' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('borrador')}
                disabled={updatingStatus}
              >
                Borrador
              </Button>
            )}
            {raceDay.estado !== 'activo' && (
              <Button
                size="sm"
                onClick={() => handleStatusUpdate('activo')}
                disabled={updatingStatus}
              >
                Activo
              </Button>
            )}
            {raceDay.estado !== 'cerrado' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleStatusUpdate('cerrado')}
                disabled={updatingStatus}
              >
                Cerrar
              </Button>
            )}
          </div>

          {/* CSV Upload + Limpiar caballos (vertical stack, right aligned) */}
          <div className="flex flex-col gap-2 w-fit sm:ml-auto">
            <CSVUpload raceDayId={raceDayId} onSuccess={loadRaceDay} />
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDeleteEntries}
              disabled={deletingEntries || (raceDay.entries && raceDay.entries.length === 0)}
            >
              {deletingEntries ? (
                <>
                  <Spinner className="h-3 w-3" />
                  Limpiando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Limpiar caballos
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Caballos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {raceDay.entries?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Matched
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {raceDay.entries?.filter(
                  (e) => e.match_status === 'matched' || e.match_status === 'manual'
                ).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Unmatched
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {raceDay.entries?.filter((e) => e.match_status === 'unmatched')
                  .length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages (after KPIs) */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Race Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Caballos del Día</CardTitle>
          </CardHeader>
          <CardContent>
            <RaceEntriesTable
              entries={raceDay.entries || []}
              raceDayId={raceDayId}
              onSuccess={loadRaceDay}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
