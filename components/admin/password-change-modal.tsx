'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PALETTE } from '@/lib/palette'
import { setUserPassword } from '@/lib/actions/admin'

interface Props {
  userId: string
  userEmail: string
}

export default function PasswordChangeModal({ userId, userEmail }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setError(null)

    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setIsLoading(true)
    try {
      await setUserPassword(userId, newPassword)
      setIsOpen(false)
      setNewPassword('')
      setConfirmPassword('')
      alert('Contraseña actualizada exitosamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs px-2 py-1 rounded-lg transition-colors"
        style={{
          background: PALETTE.background.lightAlt,
          border: `1px solid ${PALETTE.ui.border}`,
          color: PALETTE.text.secondary,
          cursor: 'pointer',
        }}>
        Cambiar contraseña
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg"
            style={{ background: PALETTE.background.white }}>

            <div className="mb-4">
              <h2 className="text-lg font-semibold" style={{ color: PALETTE.text.dark }}>
                Cambiar Contraseña
              </h2>
              <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>
                {userEmail}
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                  Nueva Contraseña
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                  Confirmar Contraseña
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir contraseña"
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2 mb-4 text-xs"
                style={{ background: PALETTE.form.errorBg, border: `1px solid ${PALETTE.form.errorBorder}` }}>
                <p style={{ color: PALETTE.form.errorText }}>{error}</p>
              </div>
            )}

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
                disabled={isLoading || !newPassword || !confirmPassword}
                style={{
                  background: PALETTE.primary.green,
                  color: '#FFFFFF',
                }}
                className="flex-1">
                {isLoading ? 'Guardando...' : 'Cambiar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
