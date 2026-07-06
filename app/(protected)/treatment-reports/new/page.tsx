import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import TreatmentReportForm from '@/components/treatment-reports/treatment-report-form'
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

export default async function NewTreatmentReportPage({
  searchParams,
}: {
  searchParams: Promise<{ horse_id?: string }>
}) {
  const user = await requireUser()
  const { horse_id } = await searchParams
  const supabase = await createClient()

  const [{ data: horses }, { data: drugs }, vetName] = await Promise.all([
    supabase.from('horses').select('*').eq('status', 'active').order('name'),
    supabase.from('drugs').select('*').eq('active', true).not('nombre', 'ilike', '%furosemide%').not('nombre', 'ilike', '%salix%').order('nombre'),
    getVetName(supabase, user),
  ])

  const typedHorses = (horses ?? []) as Horse[]
  const typedDrugs = (drugs ?? []) as Drug[]

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
          <Link href="/treatment-reports">
            <Button variant="ghost" size="sm">← Informes</Button>
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: PALETTE.primary.green }}>
          Nuevo Informe de Tratamiento
        </h1>
        <p className="text-sm" style={{ color: PALETTE.text.secondary }}>
          Artículo 811 - Reglamento 8760
        </p>
      </div>

      {/* Form */}
      <div>
        <TreatmentReportForm
          horses={typedHorses}
          drugs={typedDrugs}
          vetName={vetName}
          defaultValues={preSelectedHorse ? { horse_id: preSelectedHorse.id } : undefined}
          mode="create"
        />
      </div>
    </div>
  )
}
