'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setTechnicianSupervisors } from '@/lib/actions/admin'
import { PALETTE } from '@/lib/palette'

interface SupervisorMultiSelectProps {
  userId: string
  currentVetIds: string[]
  vets: { id: string; label: string }[]
}

export default function SupervisorMultiSelect({ userId, currentVetIds, vets }: SupervisorMultiSelectProps) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggleVet = (vetId: string) => {
    const newIds = currentVetIds.includes(vetId)
      ? currentVetIds.filter(id => id !== vetId)
      : [...currentVetIds, vetId]

    startTransition(async () => {
      try {
        await setTechnicianSupervisors(userId, newIds)
        router.refresh()
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    })
  }

  return (
    <div className="space-y-2">
      {vets.map((vet) => (
        <label
          key={vet.id}
          className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors"
          style={{
            background: PALETTE.background.lightAlt,
            opacity: pending ? 0.6 : 1,
            cursor: pending ? 'not-allowed' : 'pointer',
          }}>
          <input
            type="checkbox"
            checked={currentVetIds.includes(vet.id)}
            onChange={() => handleToggleVet(vet.id)}
            disabled={pending}
            className="rounded"
            style={{
              accentColor: PALETTE.primary.green,
            }}
          />
          <span className="text-sm" style={{ color: PALETTE.text.primary }}>
            {vet.label}
          </span>
        </label>
      ))}
    </div>
  )
}
