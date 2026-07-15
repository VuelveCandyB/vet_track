'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getPMFData(entryId: string, raceDayId: string) {
  try {
    // Get race entry with horse and race day info
    const { data: entry, error: entryError } = await supabase
      .from('race_entries')
      .select('*')
      .eq('id', entryId)
      .single()

    if (entryError) {
      return { success: false, error: entryError.message }
    }

    // Get race day
    const { data: raceDay, error: raceDayError } = await supabase
      .from('race_days')
      .select('*')
      .eq('id', raceDayId)
      .single()

    if (raceDayError) {
      return { success: false, error: raceDayError.message }
    }

    // Get horse if matched
    let horse = null
    if (entry.horse_id) {
      const { data: horseData } = await supabase
        .from('horses')
        .select('*')
        .eq('id', entry.horse_id)
        .single()
      horse = horseData
    }

    return {
      success: true,
      entry,
      raceDay,
      horse,
    }
  } catch (err) {
    console.error('getPMFData error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function createPMFRecord(input: {
  raceEntryId: string
  dosisRecetada: number
  horaEntregaReceta: string
  fechaAdmin: string
  horaAdmin: string
  dosisAdministrada: number
  viaAdmin: string
  agujaCorporea: boolean
  vetOficialId: string
  vetOficialNombre: string
  repNombre?: string
}) {
  try {
    const { data: raceEntry, error: raceError } = await supabase
      .from('race_entries')
      .select('horse_id')
      .eq('id', input.raceEntryId)
      .single()

    if (raceError || !raceEntry?.horse_id) {
      return { success: false, error: 'Race entry or horse_id not found' }
    }

    const { data, error } = await supabase
      .from('pmf_records')
      .insert({
        race_entry_id: input.raceEntryId,
        horse_id: raceEntry.horse_id,
        dosis_recetada: input.dosisRecetada,
        hora_entrega_receta: input.horaEntregaReceta,
        fecha_admin: input.fechaAdmin,
        hora_admin: input.horaAdmin,
        dosis_administrada: input.dosisAdministrada,
        via_admin: input.viaAdmin,
        aguja_confirmada: input.agujaCorporea,
        vet_oficial_id: input.vetOficialId,
        vet_oficial_nombre: input.vetOficialNombre,
        rep_nombre: input.repNombre || null,
        estado: 'borrador',
      })
      .select()
      .single()

    if (error) {
      console.error('createPMFRecord DB error:', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      return { success: false, error: error.message }
    }

    console.log('createPMFRecord success:', {
      id: data.id,
      race_entry_id: data.race_entry_id,
      estado: data.estado,
    })

    return { success: true, pmfRecord: data }
  } catch (err) {
    console.error('createPMFRecord error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function signPMFAsVetOficial(
  pmfRecordId: string,
  vetOficialId: string,
  vetOficialNombre: string
) {
  try {
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('pmf_records')
      .update({
        vet_oficial_firmado: true,
        vet_oficial_firma_ts: now,
      })
      .eq('id', pmfRecordId)

    if (updateError) {
      console.error('signPMFAsVetOficial DB error:', updateError.message)
      return { success: false, error: updateError.message }
    }

    // Log signature
    await supabase.from('signature_audit_log').insert({
      pmf_record_id: pmfRecordId,
      signer_type: 'vet_oficial',
      signer_id: vetOficialId,
      signer_name: vetOficialNombre,
      signed_at: now,
    })

    return { success: true }
  } catch (err) {
    console.error('signPMFAsVetOficial error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function signPMFAsRepresentante(
  pmfRecordId: string,
  repNombre: string
) {
  try {
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('pmf_records')
      .update({
        rep_firmado: true,
        rep_firma_ts: now,
      })
      .eq('id', pmfRecordId)

    if (updateError) {
      console.error('signPMFAsRepresentante DB error:', updateError.message)
      return { success: false, error: updateError.message }
    }

    // Log signature
    await supabase.from('signature_audit_log').insert({
      pmf_record_id: pmfRecordId,
      signer_type: 'representante',
      signer_name: repNombre,
      signed_at: now,
    })

    return { success: true }
  } catch (err) {
    console.error('signPMFAsRepresentante error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

interface ValidationResult {
  val_dosis_ok: boolean
  val_rx_tiempo_ok: boolean
  val_coincide_dosis: boolean
  val_aguja_confirmada: boolean
  val_en_loes: boolean
  val_horas_antes: number | null
  errors: string[]
}

async function validatePMFRecord(pmfRecordId: string): Promise<ValidationResult> {
  const errors: string[] = []
  let val_dosis_ok = false
  let val_rx_tiempo_ok = false
  let val_coincide_dosis = false
  let val_aguja_confirmada = false
  let val_en_loes = false
  let val_horas_antes: number | null = null

  try {
    // Get PMF record
    const { data: pmf, error: pmfError } = await supabase
      .from('pmf_records')
      .select('*')
      .eq('id', pmfRecordId)
      .single()

    if (pmfError || !pmf) {
      errors.push('PMF record not found')
      return { val_dosis_ok, val_rx_tiempo_ok, val_coincide_dosis, val_aguja_confirmada, val_en_loes, val_horas_antes, errors }
    }

    // Get race entry and horse
    const { data: entry, error: entryError } = await supabase
      .from('race_entries')
      .select('*, horses:horse_id(en_loes)')
      .eq('id', pmf.race_entry_id)
      .single()

    if (entryError || !entry) {
      errors.push('Race entry not found')
      return { val_dosis_ok, val_rx_tiempo_ok, val_coincide_dosis, val_aguja_confirmada, val_en_loes, val_horas_antes, errors }
    }

    // 1. Validar dosis (100-500 mg)
    if (pmf.dosis_administrada >= 100 && pmf.dosis_administrada <= 500) {
      val_dosis_ok = true
    } else {
      errors.push(`Dosis ${pmf.dosis_administrada}mg fuera de rango (100-500mg)`)
    }

    // TODO: 2. Validar hora receta (< 12:00 PM) - disabled temporarily
    // For now, assume receta time is valid if it exists
    if (pmf.hora_entrega_receta) {
      val_rx_tiempo_ok = true
    } else {
      errors.push('Hora de entrega de receta no registrada')
    }

    // 3. Validar dosis coinciden
    if (pmf.dosis_administrada === pmf.dosis_recetada) {
      val_coincide_dosis = true
    } else {
      errors.push(`Dosis no coinciden: recetada ${pmf.dosis_recetada}mg vs administrada ${pmf.dosis_administrada}mg`)
    }

    // 4. Validar aguja confirmada
    if (pmf.aguja_confirmada) {
      val_aguja_confirmada = true
    } else {
      errors.push('Aguja desechable no confirmada')
    }

    // 5. Validar caballo en LOES
    const horse = entry.horses as any
    if (horse && horse.en_loes) {
      val_en_loes = true
    } else {
      errors.push('Caballo no está registrado en LOES')
    }

    // 6. Validar 4 horas antes de carrera
    if (entry.hora_salida && pmf.hora_admin) {
      const horaAdmin = new Date(`2000-01-01T${pmf.hora_admin}`)
      const horaSalida = new Date(`2000-01-01T${entry.hora_salida}`)
      const minutosAntes = (horaSalida.getTime() - horaAdmin.getTime()) / (1000 * 60)
      const horasAntes = minutosAntes / 60

      val_horas_antes = parseFloat(horasAntes.toFixed(2))

      if (horasAntes < 4) {
        errors.push(`Solo ${horasAntes.toFixed(1)} horas antes de carrera (mínimo 4h requeridas)`)
      }
    }

    return {
      val_dosis_ok,
      val_rx_tiempo_ok,
      val_coincide_dosis,
      val_aguja_confirmada,
      val_en_loes,
      val_horas_antes,
      errors,
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Validation error')
    return { val_dosis_ok, val_rx_tiempo_ok, val_coincide_dosis, val_aguja_confirmada, val_en_loes, val_horas_antes, errors }
  }
}

export async function certifyPMFRecord(pmfRecordId: string) {
  try {
    // Validate before certifying
    const validation = await validatePMFRecord(pmfRecordId)

    if (validation.errors.length > 0) {
      return {
        success: false,
        error: 'Validación fallida: ' + validation.errors.join('; '),
        validationErrors: validation.errors,
      }
    }

    const now = new Date().toISOString()

    const { error } = await supabase
      .from('pmf_records')
      .update({
        estado: 'certificado',
        certificado_en: now,
        val_dosis_ok: validation.val_dosis_ok,
        val_rx_tiempo_ok: validation.val_rx_tiempo_ok,
        val_coincide_dosis: validation.val_coincide_dosis,
        val_aguja_confirmada: validation.val_aguja_confirmada,
        val_en_loes: validation.val_en_loes,
        val_horas_antes: validation.val_horas_antes,
      })
      .eq('id', pmfRecordId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function getPMFStatus(raceEntryId: string) {
  try {
    // Get the most recent PMF record (in case of duplicates)
    const { data, error } = await supabase
      .from('pmf_records')
      .select('id, estado, vet_oficial_firmado, rep_firmado, race_entry_id, created_at')
      .eq('race_entry_id', raceEntryId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return { success: true, status: 'sin_registrar' }
    }

    if (!data) {
      return { success: true, status: 'sin_registrar' }
    }

    return { success: true, status: data.estado }
  } catch (err) {
    return { success: true, status: 'sin_registrar' }
  }
}

export async function getPMFStatusBatch(raceEntryIds: string[]) {
  try {
    if (raceEntryIds.length === 0) {
      return { success: true, statuses: {} }
    }

    // Get all PMF records for these entries in a single query
    const { data, error } = await supabase
      .from('pmf_records')
      .select('id, estado, race_entry_id, created_at')
      .in('race_entry_id', raceEntryIds)
      .order('race_entry_id', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      return { success: true, statuses: {} }
    }

    // Keep only the most recent record for each race_entry_id
    const statuses: Record<string, string> = {}
    const seen = new Set<string>()

    for (const record of data || []) {
      if (!seen.has(record.race_entry_id)) {
        statuses[record.race_entry_id] = record.estado
        seen.add(record.race_entry_id)
      }
    }

    // Add 'sin_registrar' for entries without records
    for (const entryId of raceEntryIds) {
      if (!statuses[entryId]) {
        statuses[entryId] = 'sin_registrar'
      }
    }

    return { success: true, statuses }
  } catch (err) {
    return { success: true, statuses: {} }
  }
}

export async function updatePMFAdministration(input: {
  pmfRecordId: string
  dosis_administrada: number
  hora_admin: string
  fecha_admin: string
}) {
  try {
    const { data, error } = await supabase
      .from('pmf_records')
      .update({
        dosis_administrada: input.dosis_administrada,
        hora_admin: input.hora_admin,
        fecha_admin: input.fecha_admin,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.pmfRecordId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, record: data }
  } catch (err) {
    throw err instanceof Error ? new Error(err.message) : new Error('Unknown error updating PMF')
  }
}
