'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser, requireNonVaccinator, isAdmin } from '@/lib/auth'
import { getVetName, getCreatedForVetId } from '@/lib/actions/shared'
import { logActivity } from '@/lib/actions/activity-log'
import { validateCourse } from '@/lib/treatment-course'

interface MedicationRow {
  drug_id: string
  dosis: number
  dosis_unidad: string
  nivel_dosificacion?: string
  tiempo_restriccion?: number | null
  hasta_cuando?: string | null
}

// Valida el rango de cada medicamento y devuelve la fecha fin a guardar
// (null para dosis única o si coincide con el día de inicio).
function resolveHastaCuando(med: MedicationRow, fecha_tratamiento: string): string | null {
  if (!med.hasta_cuando || !fecha_tratamiento) return null
  const rangeError = validateCourse(fecha_tratamiento, med.hasta_cuando)
  if (rangeError) throw new Error(rangeError)
  return med.hasta_cuando > fecha_tratamiento ? med.hasta_cuando : null
}

export async function createTreatmentReport(formData: FormData) {
  const user = await requireNonVaccinator()
  const supabase = await createClient()

  const horse_id = formData.get('horse_id') as string
  const medicationsJson = formData.get('medications') as string
  const itemCodeIds = formData.getAll('item_code_ids') as string[]

  // Validación de campos requeridos
  if (!horse_id?.trim()) {
    throw new Error('Debe seleccionar un caballo')
  }

  let medications: MedicationRow[] = []
  if (medicationsJson) {
    try {
      medications = JSON.parse(medicationsJson)
    } catch {
      throw new Error('Formato de medicamentos inválido')
    }
  }

  if (medications.length === 0) {
    throw new Error('Debe agregar al menos un medicamento')
  }

  const numero_identificacion_caballo = formData.get('numero_identificacion_caballo') as string | null
  const establo = (formData.get('establo') as string) || ''
  const fecha_tratamiento = formData.get('fecha_tratamiento') as string
  const hora_tratamiento = (formData.get('hora_tratamiento') as string) || '00:00'
  const notas = formData.get('notas') as string | null
  const from_horse = formData.get('from_horse') as string | null

  // Validar que la fecha no sea más de 72 horas atrás
  if (fecha_tratamiento) {
    const fechaTratamientoDate = new Date(fecha_tratamiento)
    const ahora = new Date()
    const diferenciaMilisegundos = ahora.getTime() - fechaTratamientoDate.getTime()
    const diferenciasHoras = diferenciaMilisegundos / (1000 * 60 * 60)

    if (diferenciasHoras > 72) {
      throw new Error('La fecha del tratamiento no puede ser más de 72 horas atrás')
    }

    if (fechaTratamientoDate > ahora) {
      throw new Error('La fecha del tratamiento no puede ser en el futuro')
    }
  }

  // Validar rangos de dosificación diaria antes de escribir nada
  medications.forEach(med => resolveHastaCuando(med, fecha_tratamiento))

  // Calcular el nombre del médico y el ID del médico para el que se crea
  const vet_autorizado_nombre = await getVetName(supabase, user)
  const created_for_vet_id = await getCreatedForVetId(supabase, user)

  // Obtener nombres de los códigos seleccionados para concatenar en diagnostico
  const { data: codeItems } = await supabase
    .from('catalog_items')
    .select('id, name')
    .in('id', itemCodeIds)

  const diagnostico = codeItems?.map(item => item.name).join(', ') || ''

  // Crear el treatment report (sin medicamentos)
  const { data: insertedReport, error } = await supabase.from('treatment_reports').insert({
    horse_id,
    numero_identificacion_caballo,
    establo,
    tratamiento: null,
    diagnostico,
    fecha_tratamiento,
    hora_tratamiento,
    notas,
    vet_autorizado_nombre,
    created_for_vet_id,
    es_auto_generado: false,
    created_by: user.id,
  }).select('id').single()

  if (error) throw new Error(error.message)
  if (!insertedReport) throw new Error('No se pudo crear el informe')

  // Insertar medicamentos en la tabla junction
  const medicationData = medications.map(med => ({
    treatment_report_id: insertedReport.id,
    drug_id: med.drug_id,
    dosis: med.dosis,
    dosis_unidad: med.dosis_unidad || 'mg',
    nivel_dosificacion: med.nivel_dosificacion || null,
    tiempo_restriccion: med.tiempo_restriccion || null,
    hasta_cuando: resolveHastaCuando(med, fecha_tratamiento),
  }))

  console.log('📝 Inserting medications:', medicationData)
  const { error: medError } = await supabase
    .from('treatment_report_medications')
    .insert(medicationData)

  if (medError) {
    console.error('❌ Error inserting medications:', medError)
    throw new Error(`Error al guardar medicamentos: ${medError.message}`)
  }
  console.log('✅ Medications inserted successfully')

  // Insertar enlaces de códigos en la tabla de junction
  if (itemCodeIds.length > 0) {
    const junctionData = itemCodeIds.map(catalogItemId => ({
      treatment_report_id: insertedReport.id,
      catalog_item_id: catalogItemId,
    }))

    const { error: junctionError } = await supabase
      .from('treatment_report_item_codes')
      .insert(junctionData)

    if (junctionError) throw new Error(junctionError.message)
  }

  // Log activity
  await logActivity({
    user,
    action: 'treatment_report.create',
    entityType: 'treatment_report',
    entityId: insertedReport.id,
    horseId: horse_id,
    description: `Creó informe de tratamiento con ${medications.length} medicamento(s) para el caballo`,
  })

  revalidatePath('/treatment-reports')
  revalidatePath(`/treatment-reports/${insertedReport.id}`)
  if (from_horse && from_horse.trim()) {
    revalidatePath(`/horses/${from_horse}`)
  }

  // Devolver la URL para que el cliente haga el redirect
  return from_horse && from_horse.trim() ? `/horses/${from_horse}` : '/treatment-reports'
}

export async function updateTreatmentReport(id: string, formData: FormData) {
  const user = await requireNonVaccinator()
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('treatment_reports')
    .select('created_by')
    .eq('id', id)
    .single()

  const isUserAdmin = await isAdmin(user.id, user.email!)
  if (report?.created_by !== user.id && !isUserAdmin) {
    throw new Error('No tienes permiso para editar este informe')
  }

  const horse_id = formData.get('horse_id') as string
  const medicationsJson = formData.get('medications') as string
  const itemCodeIds = formData.getAll('item_code_ids') as string[]

  let medications: MedicationRow[] = []
  if (medicationsJson) {
    try {
      medications = JSON.parse(medicationsJson)
    } catch {
      throw new Error('Formato de medicamentos inválido')
    }
  }

  if (medications.length === 0) {
    throw new Error('Debe agregar al menos un medicamento')
  }

  const numero_identificacion_caballo = formData.get('numero_identificacion_caballo') as string | null
  const establo = (formData.get('establo') as string) || ''
  const fecha_tratamiento = formData.get('fecha_tratamiento') as string
  const hora_tratamiento = (formData.get('hora_tratamiento') as string) || '00:00'
  const notas = formData.get('notas') as string | null

  // Validar rangos de dosificación diaria antes de escribir nada
  medications.forEach(med => resolveHastaCuando(med, fecha_tratamiento))

  // Calcular el nombre del médico y el ID del médico para el que se edita
  const vet_autorizado_nombre = await getVetName(supabase, user)
  const created_for_vet_id = await getCreatedForVetId(supabase, user)

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
      numero_identificacion_caballo,
      establo,
      tratamiento: null,
      diagnostico,
      fecha_tratamiento,
      hora_tratamiento,
      notas,
      vet_autorizado_nombre,
      created_for_vet_id,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  // Borrar y recrear medicamentos
  await supabase
    .from('treatment_report_medications')
    .delete()
    .eq('treatment_report_id', id)

  const medicationData = medications.map(med => ({
    treatment_report_id: id,
    drug_id: med.drug_id,
    dosis: med.dosis,
    dosis_unidad: med.dosis_unidad || 'mg',
    nivel_dosificacion: med.nivel_dosificacion || null,
    tiempo_restriccion: med.tiempo_restriccion || null,
    hasta_cuando: resolveHastaCuando(med, fecha_tratamiento),
  }))

  const { error: medError } = await supabase
    .from('treatment_report_medications')
    .insert(medicationData)

  if (medError) throw new Error(medError.message)

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

  // Log activity
  await logActivity({
    user,
    action: 'treatment_report.update',
    entityType: 'treatment_report',
    entityId: id,
    horseId: horse_id,
    description: `Editó informe de tratamiento con ${medications.length} medicamento(s)`,
  })

  revalidatePath('/treatment-reports')
}

export async function deleteTreatmentReport(id: string) {
  const user = await requireNonVaccinator()
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('treatment_reports')
    .select('estado, horse_id')
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

  // Log activity
  await logActivity({
    user,
    action: 'treatment_report.delete',
    entityType: 'treatment_report',
    entityId: id,
    horseId: report?.horse_id,
    description: 'Eliminó informe de tratamiento',
  })

  revalidatePath('/treatment-reports')
}
