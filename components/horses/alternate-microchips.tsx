'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { addAlternateMicrochip, deleteAlternateMicrochip } from '@/lib/actions/horses'
import { PALETTE } from '@/lib/palette'
import type { HorseAlternateMicrochip } from '@/lib/types'

interface AlternateMicrochipsProps {
  horseId: string
  alternates: HorseAlternateMicrochip[]
  canManage: boolean
}

export default function AlternateMicrochips({ horseId, alternates, canManage }: AlternateMicrochipsProps) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddAlternate = async (formData: FormData) => {
    setIsLoading(true)
    try {
      await addAlternateMicrochip(horseId, formData)
      setIsAdding(false)
      router.refresh()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAlternate = async (altId: string) => {
    if (!confirm('¿Eliminar este microchip alterno?')) return
    setIsLoading(true)
    try {
      await deleteAlternateMicrochip(altId, horseId)
      router.refresh()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {alternates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alternates.map((alt) => (
            <div key={alt.id} className="flex items-center gap-1">
              <Badge
                className="font-mono text-xs px-1.5 py-0.5 rounded"
                style={{ background: PALETTE.background.lightAlt, color: PALETTE.primary.green }}>
                {alt.microchip}
              </Badge>
              {canManage && (
                <button
                  onClick={() => handleDeleteAlternate(alt.id)}
                  disabled={isLoading}
                  className="text-xs px-1 py-0 rounded hover:opacity-75 transition-opacity"
                  style={{ color: '#dc2626', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}>
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <>
          {!isAdding ? (
            <Button
              onClick={() => setIsAdding(true)}
              disabled={isLoading}
              size="sm"
              className="text-xs font-semibold px-2 py-1"
              style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              + Agregar
            </Button>
          ) : (
            <form action={handleAddAlternate} className="flex gap-1 items-center">
              <input
                type="text"
                name="microchip"
                placeholder="Microchip..."
                autoFocus
                disabled={isLoading}
                className="text-xs px-2 py-1 rounded border"
                style={{
                  borderColor: PALETTE.ui.border,
                  background: PALETTE.background.light,
                  color: PALETTE.text.primary,
                  cursor: isLoading ? 'not-allowed' : 'text',
                }}
                required
              />
              <Button
                type="submit"
                disabled={isLoading}
                size="sm"
                className="text-xs font-semibold px-2 py-1"
                style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
                {isLoading ? 'Guardando...' : 'OK'}
              </Button>
              <Button
                type="button"
                onClick={() => setIsAdding(false)}
                disabled={isLoading}
                size="sm"
                variant="secondary"
                className="text-xs font-semibold px-2 py-1">
                Cancelar
              </Button>
            </form>
          )}
        </>
      )}
    </div>
  )
}
