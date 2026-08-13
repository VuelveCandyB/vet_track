'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import RoleManagementModal from '@/components/admin/role-management-modal'
import ConfirmDeleteButton from '@/components/admin/confirm-delete-button'
import { updateUserProfile, setVaccinationNotifications, blockUser, unblockUser } from '@/lib/actions/admin'
import { PALETTE } from '@/lib/palette'

interface UserRowProps {
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    last_sign_in_at: string | null
    roles: string[]
    notify_vaccinations: boolean
    license_number: string
    license_renewal_date: string
    phone1: string
    phone2: string
  }
  blocked?: boolean
}

export default function UserRow({ user: u, blocked = false }: UserRowProps) {
  const router = useRouter()
  const [firstName, setFirstName] = useState(u.first_name)
  const [lastName, setLastName] = useState(u.last_name)
  const [notifyVaccinations, setNotifyVaccinations] = useState(u.notify_vaccinations)
  const [licenseNumber, setLicenseNumber] = useState(u.license_number)
  const [licenseRenewalDate, setLicenseRenewalDate] = useState(u.license_renewal_date)
  const [phone1, setPhone1] = useState(u.phone1)
  const [phone2, setPhone2] = useState(u.phone2)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notifyPending, setNotifyPending] = useState(false)
  const [blockPending, setBlockPending] = useState(false)

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('first_name', firstName)
      formData.append('last_name', lastName)
      formData.append('license_number', licenseNumber)
      formData.append('license_renewal_date', licenseRenewalDate)
      formData.append('phone1', phone1)
      formData.append('phone2', phone2)
      await updateUserProfile(u.id, formData)
    } catch (err) {
      console.error('Error:', err)
      alert('Error al guardar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleNotify = async (checked: boolean) => {
    setNotifyVaccinations(checked)
    setNotifyPending(true)
    try {
      await setVaccinationNotifications(u.id, checked)
    } catch {
      setNotifyVaccinations(!checked)
    } finally {
      setNotifyPending(false)
    }
  }

  const handleBlock = async () => {
    setBlockPending(true)
    try {
      await blockUser(u.id)
      router.refresh()
    } catch (err) {
      console.error('Error al bloquear usuario:', err)
      alert(`Error al bloquear usuario: ${err instanceof Error ? err.message : 'Desconocido'}`)
    } finally {
      setBlockPending(false)
    }
  }

  const handleUnblock = async () => {
    setBlockPending(true)
    try {
      await unblockUser(u.id)
      router.refresh()
    } catch (err) {
      console.error('Error al desbloquear usuario:', err)
      alert(`Error al desbloquear usuario: ${err instanceof Error ? err.message : 'Desconocido'}`)
    } finally {
      setBlockPending(false)
    }
  }

  return (
    <tr
      className="transition-colors hover:bg-gray-50"
      style={{
        borderBottom: `1px solid ${PALETTE.ui.border}`,
        opacity: blocked ? 0.6 : 1,
      }}
    >
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
      <td className="px-5 py-2.5">
        <Input
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          placeholder="Licencia"
          className="h-8 text-sm w-32"
        />
      </td>
      <td className="px-5 py-2.5">
        <Input
          type="date"
          value={licenseRenewalDate}
          onChange={(e) => setLicenseRenewalDate(e.target.value)}
          className="h-8 text-sm w-40"
        />
      </td>
      <td className="px-5 py-2.5">
        <Input
          value={phone1}
          onChange={(e) => setPhone1(e.target.value)}
          placeholder="Tel 1"
          className="h-8 text-sm w-32"
        />
      </td>
      <td className="px-5 py-2.5">
        <Input
          value={phone2}
          onChange={(e) => setPhone2(e.target.value)}
          placeholder="Tel 2"
          className="h-8 text-sm w-32"
        />
      </td>
      <td className="px-5 py-3 text-xs" style={{ color: PALETTE.text.secondary }}>
        {u.last_sign_in_at ? u.last_sign_in_at.slice(0, 10) : '—'}
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block px-2 py-1 text-xs font-semibold rounded"
            style={{
              background: blocked ? '#fee2e2' : '#dcfce7',
              color: blocked ? '#7f1d1d' : '#166534',
            }}
          >
            {blocked ? 'Bloqueado' : 'Activo'}
          </span>
          {blocked ? (
            <button
              type="button"
              onClick={handleUnblock}
              disabled={blockPending}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{
                background: PALETTE.primary.green,
                color: '#FFFFFF',
              }}
              title="Desbloquear usuario"
            >
              {blockPending ? '...' : 'Desbloquear'}
            </button>
          ) : (
            <ConfirmDeleteButton
              action={handleBlock}
              message={`¿Bloquear a ${u.email}? No podrá iniciar sesión.`}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{
                background: '#dc2626',
                color: '#FFFFFF',
              }}
            >
              {blockPending ? '...' : 'Bloquear'}
            </ConfirmDeleteButton>
          )}
        </div>
      </td>
      <td className="px-5 py-3">
        <RoleManagementModal
          userId={u.id}
          userEmail={u.email}
          currentRoles={u.roles}
        />
      </td>
      <td className="px-5 py-3 text-center">
        <input
          type="checkbox"
          checked={notifyVaccinations}
          disabled={notifyPending}
          onChange={e => handleToggleNotify(e.target.checked)}
          className="w-4 h-4"
          style={{ accentColor: PALETTE.primary.green }}
        />
      </td>
      <td className="px-5 py-3">
        <Button
          onClick={handleSave}
          size="sm"
          disabled={isSubmitting}
          style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}
          className="text-xs">
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </td>
    </tr>
  )
}
