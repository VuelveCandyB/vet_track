'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { createRaceDay } from '@/lib/actions/race-day'
import { CSVUpload } from '@/components/race-day/csv-upload'
import { useAuth } from '@/hooks/use-auth'

export default function NewRaceDayPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [raceDayId, setRaceDayId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fecha: '',
    hora_retiros: '08:00',
    total_carreras: 9,
  })

  const handleCreateRaceDay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await createRaceDay({
        fecha: formData.fecha,
        hora_retiros: formData.hora_retiros,
        total_carreras: formData.total_carreras,
        fuente: 'csv',
        userId: user.id,
      })

      if (!result.success) {
        setError(result.error || 'Failed to create race day')
        return
      }

      if (result.raceDay) {
        setRaceDayId(result.raceDay.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (raceDayId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">
              Día de Carreras Creado
            </h1>
            <p className="text-slate-600">Fecha: {formData.fecha}</p>
          </div>

          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Día de carreras creado exitosamente. Ahora carga el CSV con los
              caballos.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Importar Caballos</CardTitle>
              <CardDescription>
                Sube un archivo CSV con la lista de caballos que correrán hoy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CSVUpload
                raceDayId={raceDayId}
                onSuccess={() => {
                  router.push(`/race-day/${raceDayId}`)
                }}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/race-day`)}
            >
              Volver a Carreras
            </Button>
            <Button
              onClick={() => router.push(`/race-day/${raceDayId}`)}
            >
              Ver Día de Carreras
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
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

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Nuevo Día de Carreras
          </h1>
          <p className="text-slate-600">
            Crea un nuevo registro para importar caballos del día
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Día</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRaceDay} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha de Carreras</Label>
                  <Input
                    id="fecha"
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha: e.target.value })
                    }
                    className="bg-white border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora_retiros">Hora de Retiros</Label>
                  <Input
                    id="hora_retiros"
                    type="time"
                    value={formData.hora_retiros}
                    onChange={(e) =>
                      setFormData({ ...formData, hora_retiros: e.target.value })
                    }
                    className="bg-white border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_carreras">Total de Carreras</Label>
                <Input
                  id="total_carreras"
                  type="number"
                  min="1"
                  max="15"
                  value={formData.total_carreras}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      total_carreras: parseInt(e.target.value),
                    })
                  }
                  className="bg-white border-gray-200"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-1/2"
                style={{ background: '#059669', color: '#fff' }}
              >
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Creando...
                  </>
                ) : (
                  'Crear Día de Carreras'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
