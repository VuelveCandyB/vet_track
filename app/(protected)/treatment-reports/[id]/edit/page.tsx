import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getVetName } from '@/lib/actions/shared'
import TreatmentReportForm from '@/components/treatment-reports/treatment-report-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PALETTE } from '@/lib/palette'
import type { Horse, Drug, TreatmentReport } from '@/lib/types'
import type { CatalogItem } from '@/components/treatment-reports/item-codes-select'

export default async function EditTreatmentReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const supabase = await createClient()

  const [reportRes, { data: horses }, { data: drugs }, { data: itemCodes }, { data: selectedCodes }, vetName] = await Promise.all([
    supabase.from('treatment_reports').select('*').eq('id', id).single(),
    supabase.from('horses').select('*').eq('status', 'active').order('name'),
    supabase.from('drugs').select('*').eq('active', true).order('nombre'),
    supabase.from('catalog_items').select('id, name').eq('category', 'item_code').eq('active', true).order('name'),
    supabase.from('treatment_report_item_codes').select('catalog_item_id').eq('treatment_report_id', id),
    getVetName(supabase, user),
  ])

  if (reportRes.error || !reportRes.data) {
    return (
      <div className="p-6 text-red-600">
        Informe no encontrado
      </div>
    )
  }

  const report = reportRes.data as TreatmentReport
  const typedHorses = (horses ?? []) as Horse[]
  const typedDrugs = (drugs ?? []) as Drug[]
  const typedItemCodes = (itemCodes ?? []) as CatalogItem[]
  const selectedItemCodeIds = (selectedCodes ?? []).map(s => s.catalog_item_id)

  // Only allow editing if status is 'borrador'
  if (report.estado !== 'borrador') {
    return (
      <div className="p-6">
        <p className="text-red-600 mb-4">
          Solo se pueden editar informes en estado "borrador". Este informe está en estado "{report.estado}".
        </p>
        <Link href={`/treatment-reports/${id}`}>
          <Button variant="secondary">Volver al informe</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/treatment-reports">
          <Button variant="ghost" size="sm">← Informes</Button>
        </Link>
        <span>/</span>
        <Link href={`/treatment-reports/${id}`}>
          <Button variant="ghost" size="sm">Detalle</Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: PALETTE.primary.green }}>
          Editar Informe de Tratamiento
        </h1>
        <p className="text-sm" style={{ color: PALETTE.text.secondary }}>
          ID: {id}
        </p>
      </div>

      {/* Form */}
      <div className="rounded-lg p-6" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
        <TreatmentReportForm
          horses={typedHorses}
          drugs={typedDrugs}
          vetName={vetName}
          itemCodes={typedItemCodes}
          initialSelectedItemCodeIds={selectedItemCodeIds}
          defaultValues={{
            id: report.id,
            horse_id: report.horse_id,
            drug_id: report.drug_id,
            establo: report.establo,
            diagnostico: report.diagnostico,
            fecha_tratamiento: report.fecha_tratamiento,
            hora_tratamiento: report.hora_tratamiento,
            dosis: report.dosis,
            tiempo_restriccion: report.tiempo_restriccion ?? undefined,
            vet_autorizado_nombre: report.vet_autorizado_nombre,
          }}
          mode="edit"
        />
      </div>
    </div>
  )
}
