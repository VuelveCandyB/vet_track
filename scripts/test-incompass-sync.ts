/**
 * Test script for InCompass sync with small batch
 * Usage: npx tsx scripts/test-incompass-sync.ts <batchSize>
 *
 * Example: npx tsx scripts/test-incompass-sync.ts 5
 */

import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { searchIncompassHorse, parseDateFromIncompass, mapSexToGender, mapColorCode } from '@/lib/incompass'

async function main() {
  const batchSize = parseInt(process.argv[2] || '5', 10)

  console.log(`\n🔄 Iniciando sincronización pequeña (${batchSize} caballos)`)
  console.log('─'.repeat(80))

  try {
    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

    // Fetch horses with microchip
    const { data: horses, error } = await supabase
      .from('horses')
      .select('id, name, microchip, registration, birth_date, raza, madre, gender, color')
      .not('microchip', 'is', null)
      .limit(batchSize)

    if (error || !horses) {
      console.error('❌ Error fetching horses:', error?.message)
      process.exit(1)
    }

    console.log(`✓ Encontrados ${horses.length} caballos con microchip\n`)

    let matched = 0
    let updated = 0
    let notFound = 0
    const errors: any[] = []

    for (const horse of horses) {
      console.log(`→ Procesando: ${horse.name} (chip: ${horse.microchip})`)

      try {
        const result = await searchIncompassHorse(horse.microchip!)

        if (!result.found) {
          console.log(`  ○ No encontrado en InCompass\n`)
          notFound++
          continue
        }

        const data = result.data!
        matched++

        // Map fields
        const updates: Record<string, any> = {
          name: data.horseName,
          registration: data.registrationNumber,
          birth_date: data.dob ? parseDateFromIncompass(data.dob) || data.dob : null,
          raza: data.breed,
          gender: mapSexToGender(data.sex) || horse.gender,
          color: mapColorCode(data.color) || data.color,
          madre: data.dam?.horseName,
          tattoo: data.tattoo || null,
        }

        // Update horse
        const { error: updateError } = await supabase
          .from('horses')
          .update(updates)
          .eq('id', horse.id)

        if (updateError) {
          console.log(`  ✗ Error en actualización: ${updateError.message}\n`)
          errors.push({ horse: horse.name, error: updateError.message })
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

          console.log(`  ✓ Actualizado + ${markings.length} marcas\n`)
        } else {
          console.log(`  ✓ Actualizado\n`)
        }

        updated++

        // Small pause between API calls
        await new Promise(resolve => setTimeout(resolve, 350))
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.log(`  ✗ Error: ${errorMsg}\n`)
        errors.push({ horse: horse.name, error: errorMsg })
      }
    }

    console.log('─'.repeat(80))
    console.log('\n📊 Resumen:')
    console.log(`  Encontrados en InCompass: ${matched}`)
    console.log(`  Actualizados: ${updated}`)
    console.log(`  No encontrados: ${notFound}`)
    console.log(`  Errores: ${errors.length}`)

    if (errors.length > 0) {
      console.log('\n❌ Errores detallados:')
      for (const err of errors.slice(0, 5)) {
        console.log(`  - ${err.horse}: ${err.error}`)
      }
      if (errors.length > 5) {
        console.log(`  ... y ${errors.length - 5} más`)
      }
    }

    console.log('\n✅ Test completado\n')
  } catch (error) {
    console.error('❌ Error fatal:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
