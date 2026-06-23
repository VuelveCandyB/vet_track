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
  const numero_identificacion_caballo = formData.get('numero_identificacion_caballo') as string | null
  const establo = formData.get('establo') as string
  const tratamiento = formData.get('tratamiento') as string | null
  const diagnostico = formData.get('diagnostico') as string
  const fecha_tratamiento = formData.get('fecha_tratamiento') as string
  const hora_tratamiento = formData.get('hora_tratamiento') as string
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
    estado: 'borrador',
  })

  if (error) throw new Error(error.message)

  revalidatePath('/treatment-reports')

  if (from_horse) {
    redirect(`/horses/${from_horse}`)
  } else {
    redirect('/treatment-reports')
  }
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
  const establo = formData.get('establo') as string
  const tratamiento = formData.get('tratamiento') as string | null
  const diagnostico = formData.get('diagnostico') as string
  const fecha_tratamiento = formData.get('fecha_tratamiento') as string
  const hora_tratamiento = formData.get('hora_tratamiento') as string
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
