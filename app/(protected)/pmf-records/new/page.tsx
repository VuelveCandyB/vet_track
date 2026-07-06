import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PMFForm from '@/components/treatment-reports/pmf-form'
import { createPMFRecord } from '@/lib/actions/pmf-records'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PALETTE } from '@/lib/palette'
import type { Horse, Drug } from '@/lib/types'

async function getVetName(supabase: any, user: any): Promise<string> {
  try {
    const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single()
    if (data) {
      const full = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim()
      if (full) return full
    }
  } catch {}
  return user.email
}

export default async function NewPMFRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ horse_id?: string }>
}) {
  const user = await requireUser()
  const { horse_id } = await searchParams
  const supabase = await createClient()

  const [{ data: horses }, vetName] = await Promise.all([
    supabase.from('horses').select('*').eq('status', 'active').order('name'),
    getVetName(supabase, user),
  ])

  const typedHorses = (horses ?? []) as Horse[]

  // Pre-select horse if provided
  const preSelectedHorse = horse_id ? typedHorses.find(h => h.id === horse_id) : null

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        {preSelectedHorse ? (
          <Link href={`/horses/${preSelectedHorse.id}`}>
            <Button variant="ghost" size="sm">← Volver a {preSelectedHorse.name}</Button>
          </Link>
        ) : (
          <Link href="/pmf-records">
            <Button variant="ghost" size="sm">← PMF</Button>
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: PALETTE.primary.green }}>
          Nuevo PMF (Furosemide)
        </h1>
        <p className="text-sm" style={{ color: PALETTE.text.secondary }}>
          Artículo 1412 - Reglamento 8760
        </p>
      </div>

      {/* Form */}
      <div>
        <PMFForm
          horses={typedHorses}
          drugs={[]}
          vetName={vetName}
          defaultValues={preSelectedHorse ? { horse_id: preSelectedHorse.id } : undefined}
          mode="create"
          createAction={createPMFRecord}
        />
      </div>
    </div>
  )
}
