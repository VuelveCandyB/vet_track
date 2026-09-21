/**
 * Show all synced horses with data
 */

import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function main() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get horses with tattoo (recently synced ones)
    const { data: horses } = await supabase
      .from('horses')
      .select('id, name, microchip, registration, birth_date, raza, gender, color, madre, tattoo')
      .not('tattoo', 'is', null)
      .limit(5)
      .order('updated_at', { ascending: false })

    if (!horses || horses.length === 0) {
      console.log('No horses with tattoo found. Trying by microchip...\n')

      // Alternative: get by microchip
      const { data: byChip } = await supabase
        .from('horses')
        .select('id, name, microchip, registration, birth_date, raza, gender, color, madre, tattoo')
        .in('microchip', ['981020029000678', '981020055642603', '981020051774117', '981020051121572', '981020051031564'])
        .limit(5)

      if (!byChip || byChip.length === 0) {
        console.log('No horses found with those microchips either.')
        return
      }

      displayHorses(supabase, byChip)
      return
    }

    displayHorses(supabase, horses)
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

async function displayHorses(supabase: any, horses: any[]) {
  console.log('\n📊 DATOS SINCRONIZADOS DE InCompass')
  console.log('═'.repeat(110))

  for (const horse of horses) {
    console.log(`\n🐴 ${horse.name}`)
    console.log('─'.repeat(110))
    console.log(`  Microchip:      ${horse.microchip}`)
    console.log(`  Registro:       ${horse.registration || '—'}`)
    console.log(`  Fecha Nac:      ${horse.birth_date || '—'}`)
    console.log(`  Raza:           ${horse.raza || '—'}`)
    console.log(`  Género:         ${horse.gender === 'M' ? 'Macho' : horse.gender === 'H' ? 'Hembra' : '—'}`)
    console.log(`  Color:          ${horse.color || '—'}`)
    console.log(`  Madre:          ${horse.madre || '—'}`)
    console.log(`  Tatuaje:        ${horse.tattoo || '—'}`)

    // Fetch markings
    const { data: markings } = await supabase
      .from('horse_markings')
      .select('mark_part_id, text1, text2')
      .eq('horse_id', horse.id)

    if (markings && markings.length > 0) {
      console.log(`\n  📍 Marcas (${markings.length}):`)
      for (const marking of markings) {
        console.log(`    • Part ${marking.mark_part_id}: ${marking.text1}${marking.text2 ? ' | ' + marking.text2 : ''}`)
      }
    }
  }

  console.log('\n' + '═'.repeat(110))
  console.log('\n✅ Datos mostrados\n')
}

main()
