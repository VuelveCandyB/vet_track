'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { reviewMedication } from '@/lib/actions/medications'
import { Button } from '@/components/ui/button'

export default function ReviewMedicationButton({ medId }: { medId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      className="cursor-pointer"
      onClick={() => startTransition(async () => { await reviewMedication(medId); router.refresh() })}>
      {pending ? 'Marcando...' : 'Marcar revisado'}
    </Button>
  )
}
