'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { getVetName, getCreatedForVetId } from '@/lib/actions/shared'

export async function createTreatmentReport(formData: FormData) {
  const user = await requireUser()
  const supabase = await createClient()

  const horse_id = formData.get('horse_id') as string
  const drug_id = formData.get('drug_id') as string
  const itemCodeIds = formData.getAll('item_code_ids') as string[]

  // Validación de campos requeridos
  if (!horse_id?.trim()) {
    throw new Error('Debe seleccionar un caballo')
  }
  if (!drug_id?.trim()) {
    throw new Error('Debe seleccionar un medicamento')
  }

  const numero_identificacion_caballo = formData.get('numero_identificacion_caballo') as string | null
  const establo = (formData.get('establo') as string) || ''
  const fecha_tratamiento = formData.get('fecha_tratamiento') as string
  const hora_tratamiento = (formData.get('hora_tratamiento') as string) || '00:00'
  const dosis = parseFloat(formData.get('dosis') as string)
  const dosis_unidad = formData.get('dosis_unidad') as string | null
  const nivel_dosificacion = formData.get('nivel_dosificacion') as string | null
  const tiempo_restriccion_str = formData.get('tiempo_restriccion') as string
  const notas = formData.get('notas') as string | null
  const from_horse = formData.get('from_horse') as string | null

  // Calcular el nombre del médico y el ID del médico para el que se crea
  const vet_autorizado_nombre = await getVetName(supabase, user)
  const created_for_vet_id = await getCreatedForVetId(supabase, user)

  const tiempo_restriccion = tiempo_restriccion_str ? parseInt(tiempo_restriccion_str) : null

  let fecha_fin_tratamiento: string | null = null
  let hora_fin_tratamiento: string | null = null
  if (tiempo_restriccion && fecha_tratamiento) {
    const [year, month, day] = fecha_tratamiento.split('-')
    const [horaNum, minNum] = hora_tratamiento.split(':')
    const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(horaNum), parseInt(minNum))
    fecha.setHours(fecha.getHours() + tiempo_restriccion)
    fecha_fin_tratamiento = fecha.toISOString().split('T')[0]
    hora_fin_tratamiento = fecha.toISOString().split('T')[1].slice(0, 5)
  }

  // Obtener nombres de los códigos seleccionados para concatenar en diagnostico
  const { data: codeItems } = await supabase
    .from('catalog_items')
    .select('id, name')
    .in('id', itemCodeIds)

  const diagnostico = codeItems?.map(item => item.name).join(', ') || ''

  const { data: insertedReport, error } = await supabase.from('treatment_reports').insert({
    horse_id,
    drug_id,
    numero_identificacion_caballo,
    establo,
    tratamiento: null,
    diagnostico,
    fecha_tratamiento,
    hora_tratamiento,
    dosis,
    dosis_unidad,
    nivel_dosificacion,
    tiempo_restriccion,
    fecha_fin_tratamiento,
    hora_fin_tratamiento,
    notas,
    vet_autorizado_nombre,
    created_for_vet_id,
    estado: 'sometido',
    sometido_en: new Date().toISOString(),
    es_auto_generado: false,
    created_by: user.id,
  }).select('id').single()

  if (error) throw new Error(error.message)
  if (!insertedReport) throw new Error('No se pudo crear el informe')

  // Insertar enlaces en la tabla de junction
  const junctionData = itemCodeIds.map(catalogItemId => ({
    treatment_report_id: insertedReport.id,
    catalog_item_id: catalogItemId,
  }))

  const { error: junctionError } = await supabase
    .from('treatment_report_item_codes')
    .insert(junctionData)

  if (junctionError) throw new Error(junctionError.message)

  revalidatePath('/treatment-reports')
  if (from_horse && from_horse.trim()) {
    revalidatePath(`/horses/${from_horse}`)
  }

  // Devolver la URL para que el cliente haga el redirect
  return from_horse && from_horse.trim() ? `/horses/${from_horse}` : '/treatment-reports'
}

export async function updateTreatmentReport(id: string, formData: FormData) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('treatment_reports')
    .select('estado')
    .eq('id', id)
    .single()

  if (report?.estado !== 'borrador') {
    throw new Error('Solo se pueden editar informes en estado borrador')
  }

  const horse_id = formData.get('horse_id') as string
  const drug_id = formData.get('drug_id') as string
  const itemCodeIds = formData.getAll('item_code_ids') as string[]
  const numero_identificacion_caballo = formData.get('numero_identificacion_caballo') as string | null
  const establo = (formData.get('establo') as string) || ''
  const fecha_tratamiento = formData.get('fecha_tratamiento') as string
  const hora_tratamiento = (formData.get('hora_tratamiento') as string) || '00:00'
  const dosis = parseFloat(formData.get('dosis') as string)
  const dosis_unidad = formData.get('dosis_unidad') as string | null
  const nivel_dosificacion = formData.get('nivel_dosificacion') as string | null
  const tiempo_restriccion_str = formData.get('tiempo_restriccion') as string
  const notas = formData.get('notas') as string | null

  // Calcular el nombre del médico y el ID del médico para el que se edita
  const vet_autorizado_nombre = await getVetName(supabase, user)
  const created_for_vet_id = await getCreatedForVetId(supabase, user)

  const tiempo_restriccion = tiempo_restriccion_str ? parseInt(tiempo_restriccion_str) : null

  let fecha_fin_tratamiento: string | null = null
  let hora_fin_tratamiento: string | null = null
  if (tiempo_restriccion && fecha_tratamiento) {
    const [year, month, day] = fecha_tratamiento.split('-')
    const [horaNum, minNum] = hora_tratamiento.split(':')
    const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(horaNum), parseInt(minNum))
    fecha.setHours(fecha.getHours() + tiempo_restriccion)
    fecha_fin_tratamiento = fecha.toISOString().split('T')[0]
    hora_fin_tratamiento = fecha.toISOString().split('T')[1].slice(0, 5)
  }

  // Obtener nombres de los códigos seleccionados para concatenar en diagnostico
  const { data: codeItems } = await supabase
    .from('catalog_items')
    .select('id, name')
    .in('id', itemCodeIds)

  const diagnostico = codeItems?.map(item => item.name).join(', ') || ''

  const { error } = await supabase
    .from('treatment_reports')
    .update({
      horse_id,
      drug_id,
      numero_identificacion_caballo,
      establo,
      tratamiento: null,
      diagnostico,
      fecha_tratamiento,
      hora_tratamiento,
      dosis,
      dosis_unidad,
      nivel_dosificacion,
      tiempo_restriccion,
      fecha_fin_tratamiento,
      hora_fin_tratamiento,
      notas,
      vet_autorizado_nombre,
      created_for_vet_id,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  // Borrar y recrear enlaces de códigos en la tabla de junction
  await supabase
    .from('treatment_report_item_codes')
    .delete()
    .eq('treatment_report_id', id)

  if (itemCodeIds.length > 0) {
    const junctionData = itemCodeIds.map(catalogItemId => ({
      treatment_report_id: id,
      catalog_item_id: catalogItemId,
    }))

    const { error: junctionError } = await supabase
      .from('treatment_report_item_codes')
      .insert(junctionData)

    if (junctionError) throw new Error(junctionError.message)
  }

  revalidatePath('/treatment-reports')
}

export async function deleteTreatmentReport(id: string) {
  await requireUser()
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('treatment_reports')
    .select('estado')
    .eq('id', id)
    .single()

  if (report?.estado !== 'borrador') {
    throw new Error('Solo se pueden eliminar informes en estado borrador')
  }

  const { error } = await supabase
    .from('treatment_reports')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/treatment-reports')
}

export async function replicateDailyTreatmentReports() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Buscar informes que están activos (en borrador) y cuya duración aún está vigente
  const { data: activeReports } = await supabase
    .from('treatment_reports')
    .select('*')
    .eq('estado', 'borrador')
    .not('hasta_cuando', 'is', null)
    .gte('hasta_cuando', today)
    .eq('es_auto_generado', false)

  if (!activeReports || activeReports.length === 0) return { replicated: 0 }

  let replicated = 0

  for (const report of activeReports) {
    // Verificar si ya existe un informe para hoy para este caballo y medicamento
    const { data: existingToday } = await supabase
      .from('treatment_reports')
      .select('id')
      .eq('horse_id', report.horse_id)
      .eq('drug_id', report.drug_id)
      .eq('fecha_tratamiento', today)
      .single()

    if (existingToday) {
      // Ya existe informe para hoy, skip
      continue
    }

    // Crear copia del informe para hoy
    const { data: newReport, error } = await supabase.from('treatment_reports').insert({
      horse_id: report.horse_id,
      drug_id: report.drug_id,
      numero_identificacion_caballo: report.numero_identificacion_caballo,
      establo: report.establo,
      tratamiento: null,
      diagnostico: report.diagnostico,
      fecha_tratamiento: today,
      hora_tratamiento: report.hora_tratamiento,
      dosis: report.dosis,
      dosis_unidad: report.dosis_unidad,
      nivel_dosificacion: report.nivel_dosificacion,
      tiempo_restriccion: report.tiempo_restriccion,
      fecha_fin_tratamiento: report.fecha_fin_tratamiento,
      hasta_cuando: report.hasta_cuando,
      notas: report.notas,
      vet_autorizado_nombre: report.vet_autorizado_nombre,
      estado: 'sometido', // Auto-generado ya sale sometido
      es_auto_generado: true,
      informe_padre_id: report.id,
      created_by: report.created_by,
    }).select('id').single()

    if (!error && newReport) {
      // Copiar también los enlaces de códigos del informe original
      const { data: originalCodes } = await supabase
        .from('treatment_report_item_codes')
        .select('catalog_item_id')
        .eq('treatment_report_id', report.id)

      if (originalCodes && originalCodes.length > 0) {
        const newCodes = originalCodes.map(item => ({
          treatment_report_id: newReport.id,
          catalog_item_id: item.catalog_item_id,
        }))

        await supabase
          .from('treatment_report_item_codes')
          .insert(newCodes)
      }

      replicated++
    }
  }

  return { replicated }
}
