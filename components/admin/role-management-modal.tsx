'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PALETTE } from '@/lib/palette'
import { setUserRoles } from '@/lib/actions/admin'

interface RoleManagementModalProps {
  userId: string
  userEmail: string
  currentRoles: string[]
}

const ROLES = [
  { id: 'authorized_vet', label: 'Veterinario Autorizado', description: 'Crea informes de tratamiento' },
  { id: 'official_vet', label: 'Veterinario Oficial', description: 'Radica y supervisa informes' },
  { id: 'director', label: 'Director', description: 'Gestor de usuarios y auditoría' },
  { id: 'euthanasia', label: 'Personal de Eutanasia', description: 'Gestiona eutanasias' },
]

export default function RoleManagementModal({ userId, userEmail, currentRoles }: RoleManagementModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set(currentRoles))
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleRole = (roleId: string) => {
    const newSet = new Set(selectedRoles)
    if (newSet.has(roleId)) {
      newSet.delete(roleId)
    } else {
      newSet.add(roleId)
    }
    setSelectedRoles(newSet)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await setUserRoles(userId, Array.from(selectedRoles))
      setIsOpen(false)
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const roleLabels = Array.from(selectedRoles)
    .map(id => ROLES.find(r => r.id === id)?.label)
    .filter(Boolean)
    .join(', ')

  return (
    <>
      {/* Botón para abrir modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
        style={{
          background: PALETTE.background.lightAlt,
          border: `1px solid ${PALETTE.ui.border}`,
          color: PALETTE.text.secondary,
          cursor: 'pointer',
        }}>
        {roleLabels || 'Sin rol'}
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
                Gestionar Roles
              </h2>
              <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>
                {userEmail}
              </p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 mb-6">
              {ROLES.map(role => (
                <label
                  key={role.id}
                  className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  style={{
                    background: selectedRoles.has(role.id) ? PALETTE.primary.green + '10' : 'transparent',
                    border: `1px solid ${selectedRoles.has(role.id) ? PALETTE.primary.green : PALETTE.ui.border}`,
                  }}>
                  <input
                    type="checkbox"
                    checked={selectedRoles.has(role.id)}
                    onChange={() => handleToggleRole(role.id)}
                    style={{ marginTop: '4px' }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: PALETTE.text.dark }}>
                      {role.label}
                    </p>
                    <p className="text-xs mt-1" style={{ color: PALETTE.text.secondary }}>
                      {role.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                style={{
                  background: selectedRoles.size > 0 ? PALETTE.primary.green : PALETTE.text.secondary,
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
