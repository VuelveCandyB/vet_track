import { requireUser, isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getVetName } from '@/lib/actions/shared'
import TreatmentReportForm from '@/components/treatment-reports/treatment-report-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PALETTE } from '@/lib/palette'
import type { Horse, Drug, TreatmentReport } from '@/lib/types'
import type { CatalogItem } from '@/components/treatment-reports/item-codes-select'

interface MedicationRow {
  id: string
  drug_id: string
  dosis: string
  dosis_unidad: string
  nivel_dosificacion: string
  selectedCategoria: string
}

export default async function EditTreatmentReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const supabase = await createClient()

  const [reportRes, { data: horses }, { data: drugs }, { data: itemCodes }, { data: selectedCodes }, { data: medications }, vetName] = await Promise.all([
    supabase.from('treatment_reports').select('*, created_by').eq('id', id).single(),
    supabase.from('horses').select('*').eq('status', 'active').order('name'),
    supabase.from('drugs').select('*').eq('active', true).order('nombre'),
    supabase.from('catalog_items').select('id, name').eq('category', 'item_code').eq('active', true).order('name'),
    supabase.from('treatment_report_item_codes').select('catalog_item_id').eq('treatment_report_id', id),
    supabase.from('treatment_report_medications').select('*').eq('treatment_report_id', id),
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

  // Convert medications to form rows
  const initialMedications: MedicationRow[] = (medications ?? []).map(med => {
    const drug = typedDrugs.find(d => d.id === med.drug_id)
    return {
      id: med.id,
      drug_id: med.drug_id,
      dosis: med.dosis?.toString() ?? '',
      dosis_unidad: med.dosis_unidad ?? 'mg',
      nivel_dosificacion: med.nivel_dosificacion ?? '',
      selectedCategoria: drug?.categoria ?? '',
    }
  })

  // Check permissions: only creator or admin can edit
  const userIsAdmin = await isAdmin(user.id, user.email!)
  if (report.created_by !== user.id && !userIsAdmin) {
    return (
      <div className="p-6">
        <p className="text-red-600 mb-4">
          No tienes permiso para editar este informe.
        </p>
        <Link href={`/treatment-reports/${id}`}>
          <Button variant="secondary">Volver al informe</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/horses/${report.horse_id}`}>
          <Button variant="ghost" size="sm">← Volver al caballo</Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: PALETTE.primary.green }}>
          Editar Informe de Tratamiento
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
          initialSelectedItemCodeIds={selectedItemCodeIds}
          initialMedications={initialMedications}
          defaultValues={{
            id: report.id,
            horse_id: report.horse_id,
            establo: report.establo,
            diagnostico: report.diagnostico,
            fecha_tratamiento: report.fecha_tratamiento,
            hora_tratamiento: report.hora_tratamiento,
            numero_identificacion_caballo: report.numero_identificacion_caballo ?? undefined,
            notas: report.notas ?? undefined,
            vet_autorizado_nombre: report.vet_autorizado_nombre,
          }}
          mode="edit"
        />
      </div>
    </div>
  )
}
