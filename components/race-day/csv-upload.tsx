'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  parseCSV,
  matchHorses,
  uploadRaceEntries,
} from '@/lib/actions/race-day'
import { Spinner } from '@/components/ui/spinner'

interface CSVUploadProps {
  raceDayId: string
  onSuccess?: () => void
}

export function CSVUpload({ raceDayId, onSuccess }: CSVUploadProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [matchStats, setMatchStats] = useState<{
    matched: number
    unmatched: number
  } | null>(null)

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setSuccess(null)
    setParseErrors([])
    setMatchStats(null)

    try {
      // Read file
      const content = await file.text()

      // Parse CSV
      const parseResult = await parseCSV(content)
      if (!parseResult.success) {
        setParseErrors(parseResult.errors || [])
        setLoading(false)
        return
      }

      if (!parseResult.entries || parseResult.entries.length === 0) {
        setError('No valid entries found in CSV')
        setLoading(false)
        return
      }

      // Match horses
      const matchResult = await matchHorses(parseResult.entries)
      setMatchStats({
        matched: matchResult.matched.length,
        unmatched: matchResult.unmatched.length,
      })

      // Upload entries
      const uploadResult = await uploadRaceEntries({
        raceDayId,
        matched: matchResult.matched,
        unmatched: matchResult.unmatched,
      })

      if (!uploadResult.success) {
        setError(uploadResult.error || 'Failed to upload entries')
        setLoading(false)
        return
      }

      setSuccess(
        `${uploadResult.count} entries uploaded (${matchResult.matched.length} matched, ${matchResult.unmatched.length} unmatched)`
      )
      // Clear the file input
      const fileInput = document.getElementById('csv-file-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          id="csv-file-input"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={loading}
          className="hidden"
        />
        <Button
          disabled={loading}
          className="gap-2"
          onClick={() => document.getElementById('csv-file-input')?.click()}
        >
          {loading ? (
            <>
              <Spinner className="h-4 w-4" />
              Procesando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Subir CSV
            </>
          )}
        </Button>
      </div>

      {parseErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Errores en CSV:</div>
            <ul className="text-sm space-y-1">
              {parseErrors.map((err, i) => (
                <li key={i}>• {err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {matchStats && (
        <Alert>
          <AlertDescription>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-semibold">Matched:</span> {matchStats.matched}{' '}
                caballos vinculados correctamente
              </div>
              {matchStats.unmatched > 0 && (
                <div>
                  <span className="font-semibold">Unmatched:</span>{' '}
                  {matchStats.unmatched} caballos requieren asignación manual
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
