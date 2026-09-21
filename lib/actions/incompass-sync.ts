'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser, can } from '@/lib/auth'
import { logActivity } from './activity-log'
import {
  searchIncompassHorse,
  parseDateFromIncompass,
  mapSexToGender,
  type IncompassMarking,
} from '@/lib/incompass'

export async function startIncompassSync() {
  const user = await requireUser()
  const allowed = await can(user, 'horses.create', 'full')
  if (!allowed) throw new Error('Acceso denegado')

  const supabase = await createClient()

  // Count horses with microchip
  const { count } = await supabase
    .from('horses')
    .select('id', { count: 'exact', head: true })
    .not('microchip', 'is', null)

  const total = count || 0

  // Create sync run record
  const { data, error } = await supabase
    .from('incompass_sync_runs')
    .insert({
      status: 'running',
      total,
      started_by: user.id,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create sync run: ${error.message}`)

  await logActivity({
    user,
    action: 'incompass.sync_start',
    entityType: 'incompass_sync',
    entityId: data.id,
    description: `Iniciada sincronización InCompass: ${total} caballos`,
  })

  return { runId: data.id, total }
}

export async function processIncompassSyncBatch(runId: string, batchSize: number = 25) {
  const user = await requireUser()
  const allowed = await can(user, 'horses.create', 'full')
  if (!allowed) throw new Error('Acceso denegado')

  const supabase = await createClient()

  // Get current run state
  const { data: runData, error: runError } = await supabase
    .from('incompass_sync_runs')
    .select('*')
    .eq('id', runId)
    .single()

  if (runError || !runData) {
    throw new Error('Sync run not found')
  }

  if (runData.status !== 'running') {
    throw new Error(`Sync run is ${runData.status}, cannot process`)
  }

  // Fetch batch of horses to process
  const { data: horses, error: horsesError } = await supabase
    .from('horses')
    .select('id, microchip, name, registration, birth_date, raza, madre, gender, tattoo')
    .not('microchip', 'is', null)
    .order('id')
    .range(runData.current_index, runData.current_index + batchSize - 1)

  if (horsesError) {
    throw new Error(`Failed to fetch horses: ${horsesError.message}`)
  }

  const horseList = horses || []
  let processed = 0
  let matched = 0
  let updated = 0
  let notFound = 0
  const errors: string[] = [...(Array.isArray(runData.errors) ? runData.errors : [])]

  // Process each horse in batch
  for (const horse of horseList) {
    try {
      const result = await searchIncompassHorse(horse.microchip)

      if (!result.found) {
        notFound++
        processed++
        continue
      }

      const incompassData = result.data
      if (!incompassData) {
        notFound++
        processed++
        continue
      }

      matched++

      // Prepare update payload
      const updatePayload: Record<string, any> = {}
      const changes: string[] = []

      // Map name
      if (incompassData.horseName && incompassData.horseName !== horse.name) {
        updatePayload.name = incompassData.horseName
        changes.push(`name: "${horse.name}" → "${incompassData.horseName}"`)
      }

      // Map registration
      if (incompassData.registrationNumber && incompassData.registrationNumber !== horse.registration) {
        updatePayload.registration = incompassData.registrationNumber
        changes.push(`registration: "${horse.registration}" → "${incompassData.registrationNumber}"`)
      }

      // Map birth_date (parse MM/DD/YYYY to YYYY-MM-DD)
      if (incompassData.dob) {
        const parsedDob = parseDateFromIncompass(incompassData.dob)
        if (parsedDob && parsedDob !== horse.birth_date) {
          updatePayload.birth_date = parsedDob
          changes.push(`birth_date: "${horse.birth_date}" → "${parsedDob}"`)
        }
      }

      // Map breed (raza)
      if (incompassData.breed && incompassData.breed !== horse.raza) {
        updatePayload.raza = incompassData.breed
        changes.push(`raza: "${horse.raza}" → "${incompassData.breed}"`)
      }

      // Map sex to gender
      const mappedGender = mapSexToGender(incompassData.sex)
      if (mappedGender && mappedGender !== horse.gender) {
        updatePayload.gender = mappedGender
        changes.push(`gender: "${horse.gender}" → "${mappedGender}"`)
      }

      // Map dam (madre)
      if (incompassData.dam?.horseName && incompassData.dam.horseName !== horse.madre) {
        updatePayload.madre = incompassData.dam.horseName
        changes.push(`madre: "${horse.madre}" → "${incompassData.dam.horseName}"`)
      }

      // Map tattoo (new field)
      if (incompassData.tattoo && incompassData.tattoo !== horse.tattoo) {
        updatePayload.tattoo = incompassData.tattoo
        changes.push(`tattoo: "${horse.tattoo}" → "${incompassData.tattoo}"`)
      }

      // Only update if there are changes
      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
          .from('horses')
          .update(updatePayload)
          .eq('id', horse.id)

        if (updateError) {
          errors.push(`Horse ${horse.name} (${horse.microchip}): ${updateError.message}`)
        } else {
          updated++

          // Log the update
          if (changes.length > 0) {
            await logActivity({
              user,
              action: 'horse.incompass_update',
              entityType: 'horse',
              entityId: horse.id,
              horseId: horse.id,
              description: `Actualizado por InCompass: ${changes.join('; ')}`,
            })
          }
        }
      }

      // Handle markings: delete old and insert new
      if (incompassData.markings && incompassData.markings.length > 0) {
        // Delete existing markings
        await supabase.from('horse_markings').delete().eq('horse_id', horse.id)

        // Insert new markings
        const markingsToInsert = incompassData.markings.map((marking: IncompassMarking) => ({
          horse_id: horse.id,
          mark_part_id: marking.markPartId,
          text1: marking.text1,
          text2: marking.text2,
        }))

        const { error: markingError } = await supabase
          .from('horse_markings')
          .insert(markingsToInsert)

        if (markingError) {
          errors.push(`Markings for ${horse.name}: ${markingError.message}`)
        }
      }

      processed++

      // Small delay between API calls (300-500ms)
      await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200))
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Horse ${horse.name} (${horse.microchip}): ${errorMsg}`)
      processed++
    }
  }

  // Update sync run
  const newIndex = runData.current_index + processed
  const isDone = newIndex >= runData.total
  const newStatus = isDone ? 'completed' : 'running'
  const completedAt = isDone ? new Date().toISOString() : null

  const { error: updateRunError } = await supabase
    .from('incompass_sync_runs')
    .update({
      current_index: newIndex,
      matched: runData.matched + matched,
      updated: runData.updated + updated,
      not_found: runData.not_found + notFound,
      errors: errors,
      status: newStatus,
      completed_at: completedAt,
    })
    .eq('id', runId)

  if (updateRunError) {
    throw new Error(`Failed to update sync run: ${updateRunError.message}`)
  }

  // Log completion if done
  if (isDone) {
    const summary = `InCompass sync completed: ${newIndex} procesados, ${runData.updated + updated} actualizados, ${runData.not_found + notFound} no encontrados, ${errors.length} errores`

    await logActivity({
      user,
      action: 'incompass.sync_complete',
      entityType: 'incompass_sync',
      entityId: runId,
      description: summary,
    })

    revalidatePath('/horses')
  }

  return {
    done: isDone,
    processed,
    matched,
    updated,
    notFound,
    errors,
  }
}
