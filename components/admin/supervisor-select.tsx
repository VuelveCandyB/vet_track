'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setTechnicianSupervisors } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { PALETTE } from '@/lib/palette'

interface SupervisorSelectProps {
  userId: string
  currentVetIds: string[]
  vets: { id: string; label: string }[]
}

export default function SupervisorSelect({ userId, currentVetIds, vets }: SupervisorSelectProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentVetIds))
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleVet = (vetId: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(vetId)) {
      newSet.delete(vetId)
    } else {
      newSet.add(vetId)
    }
    setSelectedIds(newSet)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await setTechnicianSupervisors(userId, Array.from(selectedIds))
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setSelectedIds(new Set(currentVetIds))
    setIsOpen(false)
  }

  // Generate summary label
  const selectedVets = Array.from(selectedIds)
    .map(id => vets.find(v => v.id === id)?.label)
    .filter(Boolean)

  const summaryLabel = selectedVets.length === 0
    ? 'Sin médico'
    : selectedVets.length <= 2
      ? selectedVets.join(', ')
      : `${selectedVets.length} médicos`

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => {
          setSelectedIds(new Set(currentVetIds))
          setIsOpen(true)
        }}
        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
        style={{
          background: PALETTE.background.lightAlt,
          border: `1px solid ${PALETTE.ui.border}`,
          color: PALETTE.text.secondary,
          cursor: 'pointer',
        }}>
        {summaryLabel}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg"
            style={{ background: PALETTE.background.white }}>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold" style={{ color: PALETTE.text.dark }}>
                Médicos Supervisores
              </h2>
            </div>

            {/* Checkboxes with scroll */}
            <div className="space-y-1.5 mb-6 max-h-80 overflow-y-auto">
              {vets.map(vet => (
                <label
                  key={vet.id}
                  className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors"
                  style={{
                    background: selectedIds.has(vet.id) ? PALETTE.primary.green + '10' : 'transparent',
                    border: `1px solid ${selectedIds.has(vet.id) ? PALETTE.primary.green : PALETTE.ui.border}`,
                  }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(vet.id)}
                    onChange={() => handleToggleVet(vet.id)}
                    style={{ accentColor: PALETTE.primary.green }}
                  />
                  <span className="text-xs" style={{ color: PALETTE.text.primary }}>
                    {vet.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                style={{
                  background: selectedIds.size > 0 ? PALETTE.primary.green : PALETTE.text.secondary,
                  color: '#FFFFFF',
                }}
                className="flex-1">
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
