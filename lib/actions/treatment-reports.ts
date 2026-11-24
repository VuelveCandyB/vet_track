'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser, requireNonVaccinator, isAdmin } from '@/lib/auth'
import { getVetName, getCreatedForVetId, getUserFullName } from '@/lib/actions/shared'
import { logActivity } from '@/lib/actions/activity-log'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateCourse } from '@/lib/treatment-course'

interface MedicationRow {
  drug_id: string
  dosis: number
  dosis_unidad: string
  nivel_dosificacion?: string
  tiempo_restriccion?: number | null
  hasta_cuando?: string | null
}

// Fecha de hoy en Puerto Rico (YYYY-MM-DD), igual que el resto de la app.
function todayPR(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Puerto_Rico' })
}

// Reglas de fechas (registro retroactivo, solo hasta hoy):
// - Dosis única: no más de 72 horas atrás y no en el futuro.
// - Tratamiento diario (hasta_cuando): el fin no puede ser posterior a hoy,
//   y el curso no puede pasar de MAX_COURSE_DAYS días (incluyendo inicio y fin).
function validateTreatmentDates(fecha: string, medications: MedicationRow[]) {
  const cursos = medications.filter(m => m.hasta_cuando)

  if (cursos.length > 0) {
    const hoy = todayPR()
    if (!fecha) throw new Error('Debe indicar la fecha de inicio del tratamiento')
    if (fecha.slice(0, 10) > hoy) {
      throw new Error('La fecha de inicio no puede ser en el futuro')
    }
    for (const m of cursos) {
      const hasta = m.hasta_cuando as string
      const error = validateCourse(fecha, hasta)
      if (error) throw new Error(error)
      if (hasta.slice(0, 10) > hoy) {
        throw new Error('"Hasta cuándo" no puede ser una fecha futura')
      }
    }
    return
  }

  if (fecha) {
    const fechaTratamientoDate = new Date(fecha)
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

  validateTreatmentDates(fecha_tratamiento, medications)

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
    hasta_cuando: med.hasta_cuando || null,
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

  validateTreatmentDates(fecha_tratamiento, medications)

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
    hasta_cuando: med.hasta_cuando || null,
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

// Borra un informe completo (medicamentos y códigos incluidos). Requiere razón.
// Solo puede borrarlo el técnico que lo creó, el veterinario asignado o un administrador,
// y únicamente mientras el informe no esté revisado. Deja un registro en
// treatment_report_deletions que sale en el correo diario de borrados.
export async function deleteTreatmentReport(id: string, razon: string) {
  const user = await requireNonVaccinator()
  const motivo = (razon ?? '').trim()
  if (motivo.length < 10) {
    throw new Error('Escribe una razón de al menos 10 caracteres')
  }

  const supabase = await createClient()
  const { data: report, error: readError } = await supabase
    .from('treatment_reports')
    .select(`
      id, horse_id, fecha_tratamiento, hora_tratamiento, vet_autorizado_nombre, diagnostico,
      created_by, created_for_vet_id, reviewed_by,
      horse:horses(name),
      medications:treatment_report_medications(dosis, dosis_unidad, tiempo_restriccion, drug:drugs(nombre))
    `)
    .eq('id', id)
    .single()

  if (readError || !report) throw new Error('Informe no encontrado')
  if (report.reviewed_by) throw new Error('No se puede eliminar un informe que ya fue revisado')

  const userIsAdmin = await isAdmin(user.id, user.email!)
  const esResponsable = report.created_by === user.id || report.created_for_vet_id === user.id
  if (!userIsAdmin && !esResponsable) {
    throw new Error('No tienes permiso para eliminar este informe')
  }

  // Los borrados van con el cliente admin: las políticas RLS de medicamentos
  // solo dejan borrar al creador, y el veterinario asignado también debe poder.
  const admin = createAdminClient()
  const deletedByNombre = await getUserFullName(supabase, user)
  const horse = report.horse as unknown as { name: string } | null
  const medications = ((report.medications ?? []) as unknown as Array<{
    dosis: number
    dosis_unidad: string | null
    tiempo_restriccion: number | null
    drug: { nombre: string } | null
  }>).map(m => ({
    medicamento: m.drug?.nombre ?? null,
    dosis: m.dosis,
    dosis_unidad: m.dosis_unidad,
    tiempo_restriccion: m.tiempo_restriccion,
  }))

  const { data: auditRow, error: auditError } = await admin
    .from('treatment_report_deletions')
    .insert({
      report_id: id,
      horse_id: report.horse_id,
      horse_name: horse?.name ?? null,
      fecha_tratamiento: report.fecha_tratamiento,
      hora_tratamiento: report.hora_tratamiento,
      vet_autorizado_nombre: report.vet_autorizado_nombre,
      diagnostico: report.diagnostico,
      medications,
      razon: motivo,
      deleted_by: user.id,
      deleted_by_nombre: deletedByNombre,
    })
    .select('id')
    .single()

  if (auditError) throw new Error(`No se pudo registrar la eliminación: ${auditError.message}`)

  // Si algo falla al borrar, se quita el registro de auditoría para no dejar un borrado fantasma.
  const rollbackAudit = () => admin.from('treatment_report_deletions').delete().eq('id', auditRow.id)

  const { error: codesError } = await admin.from('treatment_report_item_codes').delete().eq('treatment_report_id', id)
  if (codesError) {
    await rollbackAudit()
    throw new Error(`Error al eliminar códigos: ${codesError.message}`)
  }

  const { error: medsError } = await admin.from('treatment_report_medications').delete().eq('treatment_report_id', id)
  if (medsError) {
    await rollbackAudit()
    throw new Error(`Error al eliminar medicamentos: ${medsError.message}`)
  }

  const { error: reportError } = await admin.from('treatment_reports').delete().eq('id', id)
  if (reportError) {
    await rollbackAudit()
    throw new Error(`Error al eliminar informe: ${reportError.message}`)
  }

  await logActivity({
    user,
    action: 'treatment_report.delete',
    entityType: 'treatment_report',
    entityId: id,
    horseId: report.horse_id,
    description: `Eliminó informe de tratamiento (${medications.length} medicamento(s)). Razón: ${motivo}`,
  })

  revalidatePath('/treatment-reports')
  if (report.horse_id) revalidatePath(`/horses/${report.horse_id}`)
}

