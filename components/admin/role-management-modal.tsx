'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PALETTE } from '@/lib/palette'
import { setUserRole } from '@/lib/actions/admin'

interface RoleManagementModalProps {
  userId: string
  userEmail: string
  currentRole: string | null
}

const ROLES = [
  { id: 'authorized_vet', label: 'Veterinario Autorizado', description: 'Crea informes de tratamiento' },
  { id: 'official_vet', label: 'Veterinario Oficial', description: 'Radica informes de tratamiento' },
  { id: 'secretary', label: 'Secretaría', description: 'Ve informes radicados' },
  { id: 'euthanasia', label: 'Personal de Eutanasia', description: 'Gestiona eutanasias' },
  { id: 'admin', label: 'Administrador', description: 'Acceso completo al sistema' },
]

export default function RoleManagementModal({ userId, userEmail, currentRole }: RoleManagementModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(currentRole || null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!selectedRole) return
    setIsLoading(true)
    try {
      await setUserRole(userId, selectedRole)
      setIsOpen(false)
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

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
        {currentRole ? ROLES.find(r => r.id === currentRole)?.label || 'Sin rol' : 'Asignar rol'}
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
                Gestionar Rol
              </h2>
              <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>
                {userEmail}
              </p>
            </div>

            {/* Radio Buttons */}
            <div className="space-y-3 mb-6">
              {ROLES.map(role => (
                <label
                  key={role.id}
                  className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  style={{
                    background: selectedRole === role.id ? PALETTE.primary.green + '10' : 'transparent',
                    border: `1px solid ${selectedRole === role.id ? PALETTE.primary.green : PALETTE.ui.border}`,
                  }}>
                  <input
                    type="radio"
                    name="role"
                    value={role.id}
                    checked={selectedRole === role.id}
                    onChange={() => setSelectedRole(role.id)}
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
                disabled={isLoading || !selectedRole}
                style={{
                  background: selectedRole ? PALETTE.primary.green : PALETTE.text.secondary,
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
