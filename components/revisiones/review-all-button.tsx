'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { reviewAllPending } from '@/lib/actions/medications'
import { Button } from '@/components/ui/button'
import { PALETTE } from '@/lib/palette'

interface ReviewAllButtonProps {
  pendingCount: number
  canReview: boolean
}

export default function ReviewAllButton({ pendingCount, canReview }: ReviewAllButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleReviewAll = async () => {
    if (!canReview || pendingCount === 0) return

    setIsLoading(true)
    try {
      const result = await reviewAllPending()
      setShowConfirm(false)
      router.refresh()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      setIsLoading(false)
    }
  }

  if (!canReview || pendingCount === 0) {
    return null
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <Button
          onClick={handleReviewAll}
          disabled={isLoading}
          className="text-sm font-semibold"
          style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
          {isLoading ? 'Revisando...' : `Sí, revisar ${pendingCount}`}
        </Button>
        <Button
          onClick={() => setShowConfirm(false)}
          disabled={isLoading}
          variant="secondary"
          className="text-sm font-semibold">
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => setShowConfirm(true)}
      disabled={isLoading}
      className="text-sm font-semibold"
      style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
      Revisar Todo ({pendingCount})
    </Button>
  )
}
