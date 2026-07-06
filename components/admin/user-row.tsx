'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import RoleManagementModal from '@/components/admin/role-management-modal'
import { updateUserProfile } from '@/lib/actions/admin'
import { PALETTE } from '@/lib/palette'

interface UserRowProps {
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    last_sign_in_at: string | null
    roles: string[]
  }
}

export default function UserRow({ user: u }: UserRowProps) {
  const [firstName, setFirstName] = useState(u.first_name)
  const [lastName, setLastName] = useState(u.last_name)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('first_name', firstName)
      formData.append('last_name', lastName)
      await updateUserProfile(u.id, formData)
    } catch (err) {
      console.error('Error:', err)
      alert('Error al guardar')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <tr className="transition-colors hover:bg-gray-50" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
      <td className="px-5 py-3 text-sm" style={{ color: PALETTE.text.primary }}>
        {u.email}
      </td>
      <td className="px-5 py-2.5">
        <Input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Nombre"
          className="h-8 text-sm w-32"
        />
      </td>
      <td className="px-5 py-2.5">
        <Input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Apellido"
          className="h-8 text-sm w-36"
        />
      </td>
      <td className="px-5 py-3 text-xs" style={{ color: PALETTE.text.secondary }}>
        {u.last_sign_in_at ? u.last_sign_in_at.slice(0, 10) : '—'}
      </td>
      <td className="px-5 py-3 flex gap-2 items-center justify-between">
        <Button
          onClick={handleSave}
          size="sm"
          disabled={isSubmitting}
          style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}
          className="text-xs">
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
        <RoleManagementModal
          userId={u.id}
          userEmail={u.email}
          currentRole={u.roles[0] || null}
        />
      </td>
    </tr>
  )
}
