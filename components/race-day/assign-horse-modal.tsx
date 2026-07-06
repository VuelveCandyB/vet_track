'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { assignHorseToEntry } from '@/lib/actions/race-day'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AssignHorseModalProps {
  open: boolean
  entryId: string
  horseNameCSV: string
  onClose: () => void
}

export default function AssignHorseModal({
  open,
  entryId,
  horseNameCSV,
  onClose,
}: AssignHorseModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [horses, setHorses] = useState<any[]>([])
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Search horses
  useEffect(() => {
    if (!searchQuery.trim()) {
      setHorses([])
      return
    }

    const search = async () => {
      setSearching(true)
      try {
        const { data } = await supabase
          .from('horses')
          .select('id, name, microchip, registration')
          .or(`name.ilike.%${searchQuery}%,microchip.eq.${searchQuery}`)
          .limit(10)

        setHorses(data || [])
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setSearching(false)
      }
    }

    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleAssign = async () => {
    if (!selectedHorseId) return

    setLoading(true)
    setError(null)

    try {
      const result = await assignHorseToEntry({
        raceEntryId: entryId,
        horseId: selectedHorseId,
      })

      if (!result.success) {
        setError(result.error || 'Failed to assign horse')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Caballo</DialogTitle>
          <DialogDescription>
            Busca y asigna un caballo a: <strong>{horseNameCSV}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Buscar por nombre o microchip
            </label>
            <Input
              placeholder="Ej: THUNDERBOLT o 840003123456789"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedHorseId(null)
              }}
              className="bg-white"
            />
          </div>

          {/* Search Results */}
          {searching ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-5 w-5" />
            </div>
          ) : horses.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {horses.map((horse) => (
                <button
                  key={horse.id}
                  onClick={() => setSelectedHorseId(horse.id)}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                    selectedHorseId === horse.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-green-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900">{horse.name}</div>
                  <div className="text-xs text-slate-600">
                    {horse.microchip && (
                      <>
                        Microchip: <span className="font-mono">{horse.microchip}</span>
                      </>
                    )}
                    {horse.registration && (
                      <>
                        {horse.microchip && ' · '}
                        Reg. {horse.registration}
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="py-8 text-center text-slate-600">
              No se encontraron caballos con esa búsqueda
            </div>
          ) : null}

          {/* Errors */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ¡Caballo asignado exitosamente!
              </AlertDescription>
            </Alert>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedHorseId || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Asignando...
                </>
              ) : (
                'Asignar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
