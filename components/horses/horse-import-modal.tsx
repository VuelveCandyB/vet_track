'use client'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { matchHorseRows, commitHorseImport } from '@/lib/actions/horse-import'
import type { ParsedHorseRow, MatchResult } from '@/lib/actions/horse-import'

interface Props {}

export default function HorseImportModal({}: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'select' | 'preview' | 'confirming'>('select')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)

  function parseExcelInBrowser(file: File): Promise<ParsedHorseRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result as ArrayBuffer
          const workbook = XLSX.read(new Uint8Array(data), { type: 'array' })

          let sheetName = 'CABALLOS ACTIVOS'
          if (!workbook.Sheets[sheetName]) {
            sheetName = workbook.SheetNames[0]
          }

          const sheet = workbook.Sheets[sheetName]
          if (!sheet) {
            throw new Error('No se encontró ninguna hoja en el archivo Excel')
          }

          const rows_data = XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false }) as Record<string, any>[]

          if (rows_data.length === 0) {
            throw new Error('El archivo Excel está vacío')
          }

          const rows: ParsedHorseRow[] = []
          for (let i = 0; i < rows_data.length; i++) {
            const row = rows_data[i]
            const errors: string[] = []

            // Parse crio_id
            let crio_id: number | null = null
            if (row['ID Caballo']) {
              const parsed = parseInt(String(row['ID Caballo']).trim(), 10)
              if (!isNaN(parsed)) {
                crio_id = parsed
              }
            }

            const name = row['Nombre'] ? String(row['Nombre']).trim() : null
            let gender: string | null = null
            if (row['Sexo']) {
              const s = String(row['Sexo']).trim().toUpperCase()
              if (s === 'H' || s === 'M') {
                gender = s
              }
            }

            let birth_date: string | null = null
            if (row['Fecha de Nacimiento']) {
              try {
                const val = row['Fecha de Nacimiento']
                if (typeof val === 'number') {
                  const parsed = XLSX.SSF.parse_date_code(val)
                  if (parsed) {
                    const y = parsed.y, m = String(parsed.m).padStart(2, '0'), d = String(parsed.d).padStart(2, '0')
                    birth_date = `${y}-${m}-${d}`
                  }
                } else if (typeof val === 'string' && val.trim()) {
                  const d = new Date(val.trim())
                  if (!isNaN(d.getTime())) {
                    birth_date = d.toISOString().split('T')[0]
                  }
                }
              } catch (e) {
                // Skip fecha
              }
            }

            let microchip: string | null = null
            if (row['Microchip']) {
              const mc = String(row['Microchip']).trim().replace(/^\*/, '')
              if (mc) {
                microchip = mc
              }
            }

            const padre = row['Padre'] ? String(row['Padre']).trim() : null
            const madre = row['Madre'] ? String(row['Madre']).trim() : null
            const raza = row['Raza'] ? String(row['Raza']).trim() : null
            const categoria = row['Categoría'] ? String(row['Categoría']).trim() : null
            const owner = row['Propietarios'] ? String(row['Propietarios']).trim() : null
            const color = row['Pelo'] ? String(row['Pelo']).trim() : null
            let ubicacion: string | null = null
            if (row['Full Location']) {
              ubicacion = String(row['Full Location']).trim()
            } else if (row['Ubicación']) {
              ubicacion = String(row['Ubicación']).trim()
            }

            rows.push({
              rowIndex: i,
              crio_id,
              name,
              gender,
              birth_date,
              microchip,
              padre,
              madre,
              raza,
              categoria,
              owner,
              color,
              ubicacion,
              errors,
            })

            // Update progress
            setProgress(Math.round(((i + 1) / rows_data.length) * 100))
          }

          resolve(rows)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Error leyendo archivo'))
      reader.readAsArrayBuffer(file)
    })
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    setLoading(true)
    setProgress(0)
    try {
      setProgressLabel('Analizando archivo Excel...')
      const rows = await parseExcelInBrowser(file)

      setProgressLabel('Emparejando con caballos existentes...')
      setProgress(0)
      const matched = await matchHorseRows(rows)
      setMatchResult(matched)

      setProgressLabel('Listo')
      setProgress(100)

      const byCrio = matched.matched.filter((m) => m.matchKey === 'crio_id').length
      const byMic = matched.matched.filter((m) => m.matchKey === 'microchip').length
      const byName = matched.matched.filter((m) => m.matchKey === 'name+birth_date').length

      toast.success(
        `Archivo cargado: ${rows.length} filas, ${matched.matched.length} coincidencias (${byCrio} CRIO, ${byMic} microchip, ${byName} nombre)`
      )

      setStep('preview')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error procesando archivo')
    } finally {
      setLoading(false)
      if (e.currentTarget) {
        e.currentTarget.value = ''
      }
    }
  }

  async function handleConfirm() {
    if (!matchResult) return

    setStep('confirming')
    setLoading(true)

    const toastId = toast.loading('Importando datos...')

    try {
      const result = await commitHorseImport(matchResult)

      if (!result.success) {
        const errMsg = result.errors[0] || 'Error desconocido'
        toast.error(errMsg, { id: toastId })
        setStep('preview')
        setLoading(false)
        return
      }

      const summary = `Importación completa: ${result.inserted} nuevos, ${result.updated} actualizados, ${result.flaggedMissing} marcados como no encontrados, ${result.reappeared} reaparecidos`

      toast.success(summary, { id: toastId })

      setOpen(false)
      setStep('select')
      setMatchResult(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error en la importación')
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="text-sm font-semibold min-w-fit"
        style={{ background: '#06b6d4', color: '#FFFFFF' }}
      >
        Importar Excel
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Caballos desde Excel</DialogTitle>
            <DialogDescription>
              {step === 'select' && 'Selecciona un archivo Excel con datos de CRIO'}
              {step === 'preview' && 'Revisa el resumen antes de confirmar'}
              {step === 'confirming' && 'Procesando importación...'}
            </DialogDescription>
          </DialogHeader>

          {step === 'select' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>

              {loading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{progressLabel}</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Solo se aceptan archivos .xls y .xlsx. El archivo debe contener una hoja
                "CABALLOS ACTIVOS" con las columnas: ID Caballo, Nombre, Sexo, Fecha de
                Nacimiento, Microchip, Pelo, Propietarios, Padre, Madre, Raza, Categoría.
              </p>
            </div>
          )}

          {step === 'preview' && matchResult && (
            <div className="space-y-6">
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {matchResult.matched.length}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Coincidencias</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {matchResult.unmatched.length}
                  </div>
                  <div className="text-xs text-green-600 mt-1">Nuevos</div>
                </div>
              </div>

              {/* Match breakdown */}
              <div className="text-sm space-y-1">
                <div className="text-gray-700">
                  <strong>Por ID CRIO:</strong>{' '}
                  {matchResult.matched.filter((m) => m.matchKey === 'crio_id').length}
                </div>
                <div className="text-gray-700">
                  <strong>Por microchip:</strong>{' '}
                  {matchResult.matched.filter((m) => m.matchKey === 'microchip').length}
                </div>
                <div className="text-gray-700">
                  <strong>Por nombre+fecha:</strong>{' '}
                  {matchResult.matched.filter((m) => m.matchKey === 'name+birth_date').length}
                </div>
              </div>

              {/* Missing from Excel */}
              {matchResult.missingFromExcel.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-sm font-semibold text-amber-900">
                    ⚠️ {matchResult.missingFromExcel.length} caballos en la BD pero NO en el Excel
                  </div>
                  <div className="text-xs text-amber-700 mt-1">
                    Se marcarán para revisión, pero no se tocarán
                  </div>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {matchResult.missingFromExcel.slice(0, 5).map((h) => (
                      <div key={h.id} className="text-xs text-amber-700">
                        • {h.name}
                      </div>
                    ))}
                    {matchResult.missingFromExcel.length > 5 && (
                      <div className="text-xs text-amber-700">
                        ... y {matchResult.missingFromExcel.length - 5} más
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('select')
                    setMatchResult(null)
                  }}
                  disabled={loading}
                >
                  Volver
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Importando...' : 'Confirmar Importación'}
                </Button>
              </div>
            </div>
          )}

          {step === 'confirming' && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin mb-4">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
              </div>
              <p className="text-gray-600">Procesando importación...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
