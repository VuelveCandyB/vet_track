'use server'

import { createClient } from '@supabase/supabase-js'
import { RaceDay, RaceEntry } from '@/lib/types/pmf'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Crear un nuevo día de carreras
 * Art. 809: Hora de Retiros y Cambios
 */
export async function createRaceDay(input: {
  fecha: string // YYYY-MM-DD
  hora_retiros?: string // HH:MM
  total_carreras?: number
  fuente: 'equibase' | 'csv' | 'manual'
  userId: string
}): Promise<{ success: boolean; raceDay?: RaceDay; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('race_days')
      .insert({
        fecha: input.fecha,
        hora_retiros: input.hora_retiros || null,
        total_carreras: input.total_carreras || null,
        fuente: input.fuente,
        creado_por: input.userId,
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to create race day',
      }
    }

    return { success: true, raceDay: data }
  } catch (err) {
    console.error('createRaceDay error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Parse CSV file into race entries
 * Expected columns: horse_name, horse_id, race_number, post_time, trainer, owner
 */
export async function parseCSV(csvContent: string): Promise<{
  success: boolean
  entries?: Array<{
    horse_nombre_csv: string
    horse_id_csv: string
    num_carrera: number
    hora_salida: string
    trainer?: string
    owner?: string
  }>
  errors?: string[]
}> {
  const lines = csvContent.trim().split('\n')
  const errors: string[] = []
  const entries: Array<{
    horse_nombre_csv: string
    horse_id_csv: string
    num_carrera: number
    hora_salida: string
    trainer?: string
    owner?: string
  }> = []

  if (lines.length < 2) {
    return {
      success: false,
      errors: ['CSV must have at least header row and one data row'],
    }
  }

  // Parse header
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const expectedColumns = [
    'horse_name',
    'horse_id',
    'race_number',
    'post_time',
  ]
  const missingColumns = expectedColumns.filter((col) => !header.includes(col))

  if (missingColumns.length > 0) {
    return {
      success: false,
      errors: [`Missing required columns: ${missingColumns.join(', ')}`],
    }
  }

  // Track horse IDs to detect if same horse appears multiple times in CSV
  const seenHorseIds = new Set<string>()

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(',').map((v) => v.trim())
    const row: Record<string, string> = {}

    header.forEach((col, idx) => {
      row[col] = values[idx] || ''
    })

    // Validate required fields
    if (!row.horse_name) {
      errors.push(`Row ${i + 1}: horse_name is required`)
      continue
    }
    if (!row.horse_id) {
      errors.push(`Row ${i + 1}: horse_id is required`)
      continue
    }
    if (!row.race_number) {
      errors.push(`Row ${i + 1}: race_number is required`)
      continue
    }
    if (!row.post_time) {
      errors.push(`Row ${i + 1}: post_time is required`)
      continue
    }

    // Validate time format HH:MM
    if (!/^\d{2}:\d{2}$/.test(row.post_time)) {
      errors.push(`Row ${i + 1}: post_time must be in HH:MM format`)
      continue
    }

    // Validate race_number is a number
    const raceNum = parseInt(row.race_number, 10)
    if (isNaN(raceNum)) {
      errors.push(`Row ${i + 1}: race_number must be a number`)
      continue
    }

    // Check for duplicate horses (same horse_id in CSV = horse runs twice same day)
    if (seenHorseIds.has(row.horse_id)) {
      errors.push(`Row ${i + 1}: El caballo ${row.horse_name} (ID: ${row.horse_id}) aparece múltiples veces. Un caballo solo puede correr una vez por día.`)
      continue
    }
    seenHorseIds.add(row.horse_id)

    entries.push({
      horse_nombre_csv: row.horse_name,
      horse_id_csv: row.horse_id,
      num_carrera: raceNum,
      hora_salida: row.post_time,
      trainer: row.trainer || undefined,
      owner: row.owner || undefined,
    })
  }

  return {
    success: errors.length === 0,
    entries: entries.length > 0 ? entries : undefined,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Match CSV horse entries to existing horses in database
 * Priority: microchip (exact) → name (case-insensitive) → unmatched
 */
export async function matchHorses(entries: Array<{
  horse_nombre_csv: string
  horse_id_csv: string
  num_carrera: number
  hora_salida: string
  trainer?: string
  owner?: string
}>): Promise<{
  success: boolean
  matched: Array<{
    entry: typeof entries[0]
    horse_id: string
    match_status: 'matched'
  }>
  unmatched: Array<{
    entry: typeof entries[0]
    match_status: 'unmatched'
  }>
}> {
  const matched: Array<{
    entry: typeof entries[0]
    horse_id: string
    match_status: 'matched'
  }> = []
  const unmatched: Array<{
    entry: typeof entries[0]
    match_status: 'unmatched'
  }> = []

  for (const entry of entries) {
    // Try exact match by microchip
    const { data: byMicrochip } = await supabase
      .from('horses')
      .select('id')
      .eq('microchip', entry.horse_id_csv)
      .single()

    if (byMicrochip) {
      matched.push({
        entry,
        horse_id: byMicrochip.id,
        match_status: 'matched',
      })
      continue
    }

    // Try fuzzy match by name
    const { data: byName } = await supabase
      .from('horses')
      .select('id')
      .ilike('name', entry.horse_nombre_csv)
      .single()

    if (byName) {
      matched.push({
        entry,
        horse_id: byName.id,
        match_status: 'matched',
      })
      continue
    }

    // No match found
    unmatched.push({
      entry,
      match_status: 'unmatched',
    })
  }

  return {
    success: true,
    matched,
    unmatched,
  }
}

/**
 * Upload matched race entries to database
 */
export async function uploadRaceEntries(input: {
  raceDayId: string
  matched: Array<{
    entry: {
      horse_nombre_csv: string
      horse_id_csv: string
      num_carrera: number
      hora_salida: string
      trainer?: string
      owner?: string
    }
    horse_id: string
    match_status: 'matched'
  }>
  unmatched: Array<{
    entry: {
      horse_nombre_csv: string
      horse_id_csv: string
      num_carrera: number
      hora_salida: string
      trainer?: string
      owner?: string
    }
    match_status: 'unmatched'
  }>
}): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const allEntries = [
      ...input.matched.map((m) => ({
        race_day_id: input.raceDayId,
        horse_id: m.horse_id,
        horse_nombre_csv: m.entry.horse_nombre_csv,
        horse_id_csv: m.entry.horse_id_csv,
        num_carrera: m.entry.num_carrera,
        hora_salida: m.entry.hora_salida,
        trainer: m.entry.trainer || null,
        owner: m.entry.owner || null,
        match_status: 'matched' as const,
      })),
      ...input.unmatched.map((u) => ({
        race_day_id: input.raceDayId,
        horse_id: null,
        horse_nombre_csv: u.entry.horse_nombre_csv,
        horse_id_csv: u.entry.horse_id_csv,
        num_carrera: u.entry.num_carrera,
        hora_salida: u.entry.hora_salida,
        trainer: u.entry.trainer || null,
        owner: u.entry.owner || null,
        match_status: 'unmatched' as const,
      })),
    ]

    const { error } = await supabase
      .from('race_entries')
      .insert(allEntries)

    if (error) {
      console.error('uploadRaceEntries DB error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        races: allEntries.map(e => ({ race: e.num_carrera, horse: e.horse_nombre_csv })),
      })

      let friendlyError = error.message

      // Detect and improve duplicate key errors
      if (error.message.includes('duplicate key value') || error.message.includes('idx_race_entries_unique_per_day')) {
        friendlyError = 'Error: Las carreras ya existen en este día. Presiona "Limpiar caballos" antes de subir un nuevo CSV.'
      }

      return {
        success: false,
        error: friendlyError,
      }
    }

    console.log('uploadRaceEntries success:', { count: allEntries.length })
    return {
      success: true,
      count: allEntries.length,
    }
  } catch (err) {
    console.error('uploadRaceEntries error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get race day with all entries
 */
export async function getRaceDayWithEntries(
  raceDayId: string
): Promise<{
  success: boolean
  raceDay?: RaceDay & { entries: RaceEntry[] }
  error?: string
}> {
  try {
    // Get race day
    const { data: raceDay, error: rdError } = await supabase
      .from('race_days')
      .select('*')
      .eq('id', raceDayId)
      .single()

    if (rdError) {
      return { success: false, error: rdError.message }
    }

    // Get entries separately
    const { data: entries, error: entriesError } = await supabase
      .from('race_entries')
      .select('*')
      .eq('race_day_id', raceDayId)

    if (entriesError) {
      return { success: false, error: entriesError.message }
    }

    return {
      success: true,
      raceDay: {
        ...raceDay,
        entries: entries || []
      }
    }
  } catch (err) {
    console.error('getRaceDayWithEntries error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Manually assign horse to unmatched race entry
 */
export async function assignHorseToEntry(input: {
  raceEntryId: string
  horseId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('race_entries')
      .update({
        horse_id: input.horseId,
        match_status: 'manual',
      })
      .eq('id', input.raceEntryId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('assignHorseToEntry error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get all race days with entry counts
 */
export async function getAllRaceDays(): Promise<{
  success: boolean
  raceDays?: Array<RaceDay & { entry_count: number; matched_count: number }>
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('race_days')
      .select(
        `
        *,
        race_entries (id, match_status)
      `
      )
      .order('fecha', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const raceDaysWithCounts = (data || []).map((rd: any) => ({
      ...rd,
      entry_count: rd.race_entries?.length || 0,
      matched_count: rd.race_entries?.filter(
        (e: any) => e.match_status === 'matched' || e.match_status === 'manual'
      ).length || 0,
    }))

    return { success: true, raceDays: raceDaysWithCounts }
  } catch (err) {
    console.error('getAllRaceDays error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Update race day status
 */
export async function updateRaceDayStatus(input: {
  raceDayId: string
  status: 'borrador' | 'activo' | 'cerrado'
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('race_days')
      .update({
        estado: input.status,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', input.raceDayId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('updateRaceDayStatus error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Delete race day (only if no PMF records)
 */
export async function deleteRaceDay(
  raceDayId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if there are any PMF records linked to this race day
    const { data: pmfRecords } = await supabase
      .from('pmf_records')
      .select('id')
      .in(
        'race_entry_id',
        (
          await supabase
            .from('race_entries')
            .select('id')
            .eq('race_day_id', raceDayId)
        ).data?.map((e: any) => e.id) || []
      )

    if (pmfRecords && pmfRecords.length > 0) {
      return {
        success: false,
        error: 'Cannot delete race day with PMF records',
      }
    }

    // Delete race entries first (cascade should handle this, but explicit is safer)
    await supabase.from('race_entries').delete().eq('race_day_id', raceDayId)

    // Delete race day
    const { error } = await supabase
      .from('race_days')
      .delete()
      .eq('id', raceDayId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('deleteRaceDay error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Delete all race entries for a specific race day
 */
export async function deleteRaceEntries(
  raceDayId: string
): Promise<{ success: boolean; error?: string; deleted?: number }> {
  try {
    // First, count how many entries exist
    const { count: existingCount } = await supabase
      .from('race_entries')
      .select('id', { count: 'exact', head: true })
      .eq('race_day_id', raceDayId)

    console.log('deleteRaceEntries - found entries:', { raceDayId, count: existingCount })

    // Delete all entries
    const { error } = await supabase
      .from('race_entries')
      .delete()
      .eq('race_day_id', raceDayId)

    if (error) {
      console.error('deleteRaceEntries DB error:', error.message)
      return { success: false, error: error.message }
    }

    console.log('deleteRaceEntries success:', { raceDayId, deleted: existingCount })
    return { success: true, deleted: existingCount || 0 }
  } catch (err) {
    console.error('deleteRaceEntries exception:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
