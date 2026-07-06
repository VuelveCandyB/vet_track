'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

export async function createTreatmentReport(formData: FormData) {
  await requireUser()
  const supabase = await createClient()

  const horse_id = formData.get('horse_id') as string
  const drug_id = formData.get('drug_id') as string

  // Validación de campos requeridos
  if (!horse_id?.trim()) {
    throw new Error('Debe seleccionar un caballo')
  }
  if (!drug_id?.trim()) {
    throw new Error('Debe seleccionar un medicamento')
  }

  const numero_identificacion_caballo = formData.get('numero_identificacion_caballo') as string | null
  const establo = (formData.get('establo') as string) || ''
  const tratamiento = formData.get('tratamiento') as string | null
  const diagnostico = formData.get('diagnostico') as string
  const fecha_tratamiento = formData.get('fecha_tratamiento') as string
  const hora_tratamiento = (formData.get('hora_tratamiento') as string) || '00:00'
  const dosis = parseFloat(formData.get('dosis') as string)
  const dosis_unidad = formData.get('dosis_unidad') as string | null
  const nivel_dosificacion = formData.get('nivel_dosificacion') as string | null
  const tiempo_restriccion_str = formData.get('tiempo_restriccion') as string
  const notas = formData.get('notas') as string | null
  const vet_autorizado_nombre = formData.get('vet_autorizado_nombre') as string
  const from_horse = formData.get('from_horse') as string | null

  const tiempo_restriccion = tiempo_restriccion_str ? parseInt(tiempo_restriccion_str) : null

  let fecha_fin_tratamiento: string | null = null
  if (tiempo_restriccion && fecha_tratamiento) {
    const fecha = new Date(fecha_tratamiento)
    fecha.setHours(fecha.getHours() + tiempo_restriccion)
    fecha_fin_tratamiento = fecha.toISOString().split('T')[0]
  }

  const { error } = await supabase.from('treatment_reports').insert({
    horse_id,
    drug_id,
    numero_identificacion_caballo,
    establo,
    tratamiento,
    diagnostico,
    fecha_tratamiento,
    hora_tratamiento,
    dosis,
    dosis_unidad,
    nivel_dosificacion,
    tiempo_restriccion,
    fecha_fin_tratamiento,
    notas,
    vet_autorizado_nombre,
    estado: 'sometido',
    sometido_en: new Date().toISOString(),
    es_auto_generado: false,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/treatment-reports')
  if (from_horse && from_horse.trim()) {
    revalidatePath(`/horses/${from_horse}`)
  }

  // Devolver la URL para que el cliente haga el redirect
  return from_horse && from_horse.trim() ? `/horses/${from_horse}` : '/treatment-reports'
}

export async function updateTreatmentReport(id: string, formData: FormData) {
  await requireUser()
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
  const numero_identificacion_caballo = formData.get('numero_identificacion_caballo') as string | null
  const establo = (formData.get('establo') as string) || ''
  const tratamiento = formData.get('tratamiento') as string | null
  const diagnostico = formData.get('diagnostico') as string
  const fecha_tratamiento = formData.get('fecha_tratamiento') as string
  const hora_tratamiento = (formData.get('hora_tratamiento') as string) || '00:00'
  const dosis = parseFloat(formData.get('dosis') as string)
  const dosis_unidad = formData.get('dosis_unidad') as string | null
  const nivel_dosificacion = formData.get('nivel_dosificacion') as string | null
  const tiempo_restriccion_str = formData.get('tiempo_restriccion') as string
  const notas = formData.get('notas') as string | null
  const vet_autorizado_nombre = formData.get('vet_autorizado_nombre') as string

  const tiempo_restriccion = tiempo_restriccion_str ? parseInt(tiempo_restriccion_str) : null

  let fecha_fin_tratamiento: string | null = null
  if (tiempo_restriccion && fecha_tratamiento) {
    const fecha = new Date(fecha_tratamiento)
    fecha.setHours(fecha.getHours() + tiempo_restriccion)
    fecha_fin_tratamiento = fecha.toISOString().split('T')[0]
  }

  const { error } = await supabase
    .from('treatment_reports')
    .update({
      horse_id,
      drug_id,
      numero_identificacion_caballo,
      establo,
      tratamiento,
      diagnostico,
      fecha_tratamiento,
      hora_tratamiento,
      dosis,
      dosis_unidad,
      nivel_dosificacion,
      tiempo_restriccion,
      fecha_fin_tratamiento,
      notas,
      vet_autorizado_nombre,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/treatment-reports')
}

export async function updateTreatmentReportStatus(id: string, nuevoEstado: string) {
  await requireUser()
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('treatment_reports')
    .select('estado')
    .eq('id', id)
    .single()

  if (!report) throw new Error('Informe no encontrado')

  const estadoActual = report.estado as string
  const transicionesValidas: Record<string, string[]> = {
    borrador: ['sometido'],
    sometido: ['radicado'],
    radicado: [],
  }

  if (!transicionesValidas[estadoActual]?.includes(nuevoEstado)) {
    throw new Error(
      `No se puede cambiar de ${estadoActual} a ${nuevoEstado}`
    )
  }

  const updateData: Record<string, unknown> = { estado: nuevoEstado }

  // Registrar timestamps de audit
  if (nuevoEstado === 'sometido') {
    updateData.sometido_en = new Date().toISOString()
  } else if (nuevoEstado === 'radicado') {
    updateData.radicado_en = new Date().toISOString()
  }

  const { error } = await supabase
    .from('treatment_reports')
    .update(updateData)
    .eq('id', id)

  if (error) throw new Error(error.message)

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

export async function radicateTreatmentReport(id: string) {
  await requireUser()
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('treatment_reports')
    .select('estado')
    .eq('id', id)
    .single()

  if (!report) throw new Error('Informe no encontrado')
  if (report.estado !== 'sometido') {
    throw new Error('Solo se pueden radicar informes en estado sometido')
  }

  const { error } = await supabase
    .from('treatment_reports')
    .update({ estado: 'radicado', radicado_en: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/treatment-reports')
  revalidatePath(`/treatment-reports/${id}`)
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
    const { error } = await supabase.from('treatment_reports').insert({
      horse_id: report.horse_id,
      drug_id: report.drug_id,
      numero_identificacion_caballo: report.numero_identificacion_caballo,
      establo: report.establo,
      tratamiento: report.tratamiento,
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
    })

    if (!error) {
      replicated++
    }
  }

  return { replicated }
}
