import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getVetName } from '@/lib/actions/shared'
import TreatmentReportForm from '@/components/treatment-reports/treatment-report-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PALETTE } from '@/lib/palette'
import type { Horse, Drug } from '@/lib/types'
import type { CatalogItem } from '@/components/treatment-reports/item-codes-select'

export default async function NewTreatmentReportPage({
  searchParams,
}: {
  searchParams: Promise<{ horse_id?: string }>
}) {
  const user = await requireUser()
  const { horse_id } = await searchParams
  const supabase = await createClient()

  const [{ data: horses }, { data: drugs }, { data: itemCodes }, vetName, { data: targetHorse }] = await Promise.all([
    supabase.from('horses').select('id, name, color, status, microchip, birth_date, gender, red_flag').order('name').limit(5000),
    supabase.from('drugs').select('*').eq('active', true).not('nombre', 'ilike', '%furosemide%').not('nombre', 'ilike', '%salix%').order('nombre'),
    supabase.from('catalog_items').select('id, name').eq('category', 'item_code').eq('active', true).order('name'),
    getVetName(supabase, user),
    horse_id ? supabase.from('horses').select('id, name, color, status, microchip, birth_date, gender, red_flag').eq('id', horse_id).single() : Promise.resolve({ data: null }),
  ])

  let typedHorses = (horses ?? []) as Horse[]
  const typedDrugs = (drugs ?? []) as Drug[]
  const typedItemCodes = (itemCodes ?? []) as CatalogItem[]

  // If horse_id provided and not found in list, add it
  if (horse_id && targetHorse && !typedHorses.find(h => h.id === horse_id)) {
    typedHorses = [targetHorse as Horse, ...typedHorses]
  }

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
          itemCodes={typedItemCodes}
          initialSelectedItemCodeIds={[]}
          defaultValues={preSelectedHorse ? { horse_id: preSelectedHorse.id } : undefined}
          mode="create"
        />
      </div>
    </div>
  )
}
