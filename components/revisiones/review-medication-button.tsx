'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { reviewMedication } from '@/lib/actions/medications'
import { Button } from '@/components/ui/button'

export default function ReviewMedicationButton({ medId, canReview }: { medId: string; canReview: boolean }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending || !canReview}
      className="cursor-pointer"
      title={!canReview ? 'Solo veterinarios autorizados pueden marcar como revisado' : undefined}
      onClick={() => startTransition(async () => { await reviewMedication(medId); router.refresh() })}>
      {pending ? 'Marcando...' : 'Marcar revisado'}
    </Button>
  )
}
