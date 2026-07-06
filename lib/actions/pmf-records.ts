'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

export async function createPMFRecord(formData: FormData) {
  await requireUser()
  const supabase = await createClient()

  const horse_id = formData.get('horse_id') as string

  // Validación de campos requeridos
  if (!horse_id?.trim()) {
    throw new Error('Debe seleccionar un caballo')
  }

  const vet_autorizado_nombre = formData.get('vet_autorizado_nombre') as string
  const dosis_recetada_str = formData.get('dosis_recetada') as string
  const hora_entrega_receta = formData.get('hora_entrega_receta') as string
  const fecha_admin = formData.get('fecha_admin') as string
  const hora_admin = formData.get('hora_admin') as string
  const dosis_administrada_str = formData.get('dosis_administrada') as string
  const via_admin = formData.get('via_admin') as string
  const aguja_confirmada = formData.get('aguja_confirmada') === 'on'
  const horse_id_oficial = formData.get('horse_id_oficial') as string
  const observaciones = formData.get('observaciones') as string | null
  const from_horse = formData.get('from_horse') as string | null

  // Validación de campos numéricos
  if (!dosis_recetada_str?.trim()) {
    throw new Error('Dosis recetada es requerida')
  }
  if (!dosis_administrada_str?.trim()) {
    throw new Error('Dosis administrada es requerida')
  }

  const dosis_recetada = parseInt(dosis_recetada_str)
  const dosis_administrada = parseInt(dosis_administrada_str)

  if (isNaN(dosis_recetada)) {
    throw new Error('Dosis recetada debe ser un número válido')
  }
  if (isNaN(dosis_administrada)) {
    throw new Error('Dosis administrada debe ser un número válido')
  }

  const { error } = await supabase.from('pmf_records').insert({
    horse_id,
    race_entry_id: null, // Por ahora NULL - se linkeará en carreras
    vet_autorizado_nombre,
    dosis_recetada,
    hora_entrega_receta,
    fecha_admin: fecha_admin,
    hora_admin,
    dosis_administrada,
    via_admin,
    aguja_confirmada,
    horse_id_oficial,
    observaciones,
    estado: 'borrador',
  })

  if (error) throw new Error(error.message)

  // Marcar el caballo como autorizado para PMF
  const { error: horseError } = await supabase.from('horses').update({
    pmf_authorized: true,
  }).eq('id', horse_id)

  if (horseError) throw new Error(horseError.message)

  revalidatePath('/pmf-records')
  if (from_horse && from_horse.trim()) {
    revalidatePath(`/horses/${from_horse}`)
  }

  // Devolver la URL para que el cliente haga el redirect
  return from_horse && from_horse.trim() ? `/horses/${from_horse}` : '/pmf-records'
}

export async function updatePMFRecord(id: string, formData: FormData) {
  await requireUser()
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('pmf_records')
    .select('estado')
    .eq('id', id)
    .single()

  if (report?.estado !== 'borrador') {
    throw new Error('Solo se pueden editar PMF en estado borrador')
  }

  const vet_autorizado_nombre = formData.get('vet_autorizado_nombre') as string
  const dosis_recetada_str = formData.get('dosis_recetada') as string
  const hora_entrega_receta = formData.get('hora_entrega_receta') as string
  const fecha_admin = formData.get('fecha_admin') as string
  const hora_admin = formData.get('hora_admin') as string
  const dosis_administrada_str = formData.get('dosis_administrada') as string
  const via_admin = formData.get('via_admin') as string
  const aguja_confirmada = formData.get('aguja_confirmada') === 'on'
  const horse_id_oficial = formData.get('horse_id_oficial') as string
  const observaciones = formData.get('observaciones') as string | null

  // Validación de campos numéricos
  if (!dosis_recetada_str?.trim()) {
    throw new Error('Dosis recetada es requerida')
  }
  if (!dosis_administrada_str?.trim()) {
    throw new Error('Dosis administrada es requerida')
  }

  const dosis_recetada = parseInt(dosis_recetada_str)
  const dosis_administrada = parseInt(dosis_administrada_str)

  if (isNaN(dosis_recetada)) {
    throw new Error('Dosis recetada debe ser un número válido')
  }
  if (isNaN(dosis_administrada)) {
    throw new Error('Dosis administrada debe ser un número válido')
  }

  const { error } = await supabase
    .from('pmf_records')
    .update({
      vet_autorizado_nombre,
      dosis_recetada,
      hora_entrega_receta,
      fecha_admin,
      hora_admin,
      dosis_administrada,
      via_admin,
      aguja_confirmada,
      horse_id_oficial,
      observaciones,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/pmf-records')
}

export async function updatePMFRecordStatus(id: string, nuevoEstado: string) {
  await requireUser()
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('pmf_records')
    .select('estado')
    .eq('id', id)
    .single()

  if (!report) throw new Error('PMF no encontrado')

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
    .from('pmf_records')
    .update(updateData)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/pmf-records')
}

export async function deletePMFRecord(id: string) {
  await requireUser()
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('pmf_records')
    .select('estado')
    .eq('id', id)
    .single()

  if (report?.estado !== 'borrador') {
    throw new Error('Solo se pueden eliminar PMF en estado borrador')
  }

  const { error } = await supabase
    .from('pmf_records')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/pmf-records')
}

export async function radicatePMFRecord(id: string) {
  await requireUser()
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('pmf_records')
    .select('estado')
    .eq('id', id)
    .single()

  if (!report) throw new Error('PMF no encontrado')
  if (report.estado !== 'sometido') {
    throw new Error('Solo se pueden radicar PMF en estado sometido')
  }

  const { error } = await supabase
    .from('pmf_records')
    .update({ estado: 'radicado', radicado_en: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/pmf-records')
  revalidatePath(`/pmf-records/${id}`)
}
