import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Plus, Calendar } from 'lucide-react'
import { DownloadCSVTemplate } from '@/components/race-day/download-csv-template'
import { RaceDaysList } from '@/components/race-day/race-days-list'
import { requirePageAccess } from '@/lib/auth'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Race Day Management | VetTrack',
  description: 'Create and manage race day schedules, import horses, and register PMF',
}

export default async function RaceDayPage() {
  await requirePageAccess('page.race_day')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">
              Gestión de Días de Carreras
            </h1>
            <p className="text-slate-600">
              Crea, importa caballos, y gestiona medicación con Furosemida
            </p>
          </div>
          <Link href="/race-day/new">
            <Button className="gap-2" style={{ background: '#059669', color: '#fff' }}>
              <Plus className="h-4 w-4" />
              Nuevo Día
            </Button>
          </Link>
        </div>

        {/* Quick Access */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Descargar Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DownloadCSVTemplate />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Instrucciones CSV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href="/templates/CSV_IMPORT_INSTRUCTIONS.md"
                className="text-sm text-blue-600 hover:underline font-semibold"
              >
                Ver Guía Completa →
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Formato Esperado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-mono bg-slate-50 p-2 rounded border border-slate-200">
                horse_name, horse_id, race_number, post_time, ...
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Race Days List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Todos los Días de Carreras
            </CardTitle>
            <CardDescription>
              Lista de días de carreras créados, ordena por fecha más reciente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RaceDaysList />
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <AlertCircle className="h-5 w-5" />
              Flujo de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-bold text-blue-900 min-w-6">
                  1.
                </span>
                <span>
                  <strong>Crear día:</strong> Haz clic en "Nuevo Día" y llena
                  fecha + hora de retiros
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-bold text-blue-900 min-w-6">
                  2.
                </span>
                <span>
                  <strong>Subir CSV:</strong> Exporta caballos desde Equibase y
                  sube el archivo
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-bold text-blue-900 min-w-6">
                  3.
                </span>
                <span>
                  <strong>Matching:</strong> El sistema vincula automáticamente
                  por microchip/nombre
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-bold text-blue-900 min-w-6">
                  4.
                </span>
                <span>
                  <strong>Revisar:</strong> Asigna manualmente los caballos sin
                  match (badges rojos)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-bold text-blue-900 min-w-6">
                  5.
                </span>
                <span>
                  <strong>PMF:</strong> Para caballos en LOES, registra
                  Furosemida con firma dual
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-bold text-blue-900 min-w-6">
                  6.
                </span>
                <span>
                  <strong>Certificar:</strong> Genera PDF y distribúye a
                  autoridades
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
