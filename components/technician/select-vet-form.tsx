'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setActiveVet } from '@/lib/actions/technician'
import { Button } from '@/components/ui/button'
import { PALETTE } from '@/lib/palette'

interface Vet {
  id: string
  name: string
}

export default function SelectVetForm({ vets }: { vets: Vet[] }) {
  const router = useRouter()
  const [selectedVet, setSelectedVet] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSelectVet() {
    if (!selectedVet) return

    setLoading(true)
    setError('')

    try {
      await setActiveVet(selectedVet)
      router.push('/dashboard')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al seleccionar médico')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#FEE2E2', border: `1px solid ${PALETTE.ui.border}`, color: '#DC2626' }}>
          {error}
        </div>
      )}

      <div className="space-y-3">
        {vets.map(vet => (
          <button
            key={vet.id}
            onClick={() => setSelectedVet(vet.id)}
            className="w-full p-4 rounded-lg border-2 transition-colors text-left"
            style={{
              background: selectedVet === vet.id ? PALETTE.background.lightAlt : PALETTE.background.white,
              borderColor: selectedVet === vet.id ? PALETTE.primary.green : PALETTE.ui.border,
              color: PALETTE.text.primary,
            }}>
            <div className="font-semibold">{vet.name}</div>
          </button>
        ))}
      </div>

      <Button
        onClick={handleSelectVet}
        disabled={!selectedVet || loading}
        className="w-full"
        style={{
          background: selectedVet && !loading ? PALETTE.primary.green : '#9CA3AF',
          color: 'white',
        }}>
        {loading ? 'Cargando...' : 'Continuar'}
      </Button>
    </div>
  )
}
