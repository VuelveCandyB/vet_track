/**
 * Show data from recently synced horses
 * Usage: npx tsx scripts/show-sync-results.ts
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

    // Fetch the 5 horses we just synced
    const horseNames = ['GRAND JOKER', 'ACANGANA', 'ALLUVIUM GOLD', 'BAJO CERO', 'SKY STAR']

    console.log('\n📊 DATOS SINCRONIZADOS DE InCompass')
    console.log('═'.repeat(100))

    for (const name of horseNames) {
      console.log(`\n🐴 ${name}`)
      console.log('─'.repeat(100))

      // Fetch horse data
      const { data: horseList, error } = await supabase
        .from('horses')
        .select('id, name, microchip, registration, birth_date, raza, gender, color, madre, tattoo')
        .eq('name', name)
        .limit(1)

      if (error) {
        console.log(`  ❌ Error: ${error.message}`)
        continue
      }

      if (!horseList || horseList.length === 0) {
        console.log(`  ⚠️  No encontrado`)
        continue
      }

      const horses = horseList[0]

      // Display horse data
      console.log(`  Microchip:    ${horses.microchip}`)
      console.log(`  Registro:     ${horses.registration || '—'}`)
      console.log(`  Fecha Nac:    ${horses.birth_date || '—'}`)
      console.log(`  Raza:         ${horses.raza || '—'}`)
      console.log(`  Género:       ${horses.gender === 'M' ? 'Macho' : horses.gender === 'H' ? 'Hembra' : '—'}`)
      console.log(`  Color:        ${horses.color || '—'}`)
      console.log(`  Madre:        ${horses.madre || '—'}`)
      console.log(`  Tatuaje:      ${horses.tattoo || '—'}`)

      // Fetch markings
      const { data: markings } = await supabase
        .from('horse_markings')
        .select('mark_part_id, text1, text2')
        .eq('horse_id', horses.id)

      if (markings && markings.length > 0) {
        console.log(`\n  📍 Marcas (${markings.length}):`)
        for (const marking of markings) {
          console.log(`    • Part ${marking.mark_part_id}: ${marking.text1}${marking.text2 ? ' | ' + marking.text2 : ''}`)
        }
      }
    }

    console.log('\n' + '═'.repeat(100))
    console.log('\n✅ Datos mostrados\n')
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
