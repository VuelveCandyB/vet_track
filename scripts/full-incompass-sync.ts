/**
 * Full InCompass sync for all active horses
 * Syncs all 1,426 active horses
 */

import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { searchIncompassHorse, parseDateFromIncompass, mapSexToGender } from '@/lib/incompass'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  console.log('\n🔄 SINCRONIZACIÓN MASIVA DE InCompass')
  console.log('═'.repeat(80))
  console.log('Sincronizando todos los caballos activos...\n')

  // Fetch all active horses with microchip
  const { data: horses, error } = await supabase
    .from('horses')
    .select('id, name, microchip, status')
    .eq('status', 'active')
    .not('microchip', 'is', null)
    .order('name')
    .limit(2000)  // Supabase default is 1000, we need more

  if (error || !horses) {
    console.error('❌ Error fetching horses:', error?.message)
    process.exit(1)
  }

  console.log(`📋 Encontrados ${horses.length} caballos para sincronizar\n`)

  let matched = 0
  let updated = 0
  let notFound = 0
  let errorCount = 0
  const errors: { name: string; error: string }[] = []

  // Process in batches
  const BATCH_SIZE = 25
  for (let i = 0; i < horses.length; i += BATCH_SIZE) {
    const batch = horses.slice(i, i + BATCH_SIZE)
    console.log(`\n→ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(horses.length / BATCH_SIZE)}`)
    console.log(`  Procesando caballos ${i + 1}-${Math.min(i + BATCH_SIZE, horses.length)}...`)

    for (const horse of batch) {
      try {
        const result = await searchIncompassHorse(horse.microchip!)

        if (!result.found) {
          console.log(`  ○ ${horse.name} - No encontrado`)
          notFound++
          continue
        }

        const data = result.data!
        matched++

        // Map fields (keep existing name if InCompass returns empty)
        const updates: Record<string, any> = {
          registration: data.registrationNumber,
          birth_date: data.dob ? parseDateFromIncompass(data.dob) || data.dob : null,
          raza: data.breed,
          gender: mapSexToGender(data.sex) || horse.gender,
          color: data.color,
          madre: data.dam?.horseName,
          tattoo: data.tattoo || null,
        }

        // Only update name if InCompass has a value
        if (data.horseName && data.horseName.trim()) {
          updates.name = data.horseName
        }

        // Update horse
        const { error: updateError } = await supabase
          .from('horses')
          .update(updates)
          .eq('id', horse.id)

        if (updateError) {
          console.log(`  ✗ ${horse.name} - Error: ${updateError.message}`)
          errors.push({ name: horse.name, error: updateError.message })
          errorCount++
          continue
        }

        // Delete and insert markings
        if (data.markings && data.markings.length > 0) {
          await supabase.from('horse_markings').delete().eq('horse_id', horse.id)

          const markings = data.markings.map(m => ({
            horse_id: horse.id,
            mark_part_id: m.markPartId,
            text1: m.text1,
            text2: m.text2,
          }))

          await supabase.from('horse_markings').insert(markings)
        }

        console.log(`  ✓ ${horse.name}`)
        updated++

        // Pause between API calls
        await new Promise(resolve => setTimeout(resolve, 400))
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.log(`  ✗ ${horse.name} - Error: ${errorMsg}`)
        errors.push({ name: horse.name, error: errorMsg })
        errorCount++
      }
    }

    const progress = Math.min(i + BATCH_SIZE, horses.length)
    const percentage = Math.round((progress / horses.length) * 100)
    console.log(`  [${percentage}%] ${progress}/${horses.length}`)
  }

  console.log('\n' + '═'.repeat(80))
  console.log('\n📊 RESUMEN FINAL:')
  console.log(`  Encontrados:     ${matched}`)
  console.log(`  Actualizados:    ${updated}`)
  console.log(`  No encontrados:  ${notFound}`)
  console.log(`  Errores:         ${errorCount}`)

  if (errors.length > 0) {
    console.log('\n❌ Errores detallados:')
    for (const err of errors.slice(0, 10)) {
      console.log(`  - ${err.name}: ${err.error}`)
    }
    if (errors.length > 10) {
      console.log(`  ... y ${errors.length - 10} más`)
    }
  }

  console.log('\n✅ Sincronización completada\n')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
