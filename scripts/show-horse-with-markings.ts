/**
 * Show a horse with markings
 * Run this after sync completes
 */

import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  console.log('\n🐴 BUSCANDO UN CABALLO CON MARCAS CORPORALES...\n')

  // Get a horse with markings
  const { data: markingData } = await supabase
    .from('horse_markings')
    .select('horse_id')
    .limit(1)

  if (!markingData || markingData.length === 0) {
    console.log('❌ No se encontraron marcas corporales\n')
    return
  }

  const horseId = markingData[0].horse_id

  // Get the horse details
  const { data: horse } = await supabase
    .from('horses')
    .select('id, name, raza, madre')
    .eq('id', horseId)
    .single()

  // Get all markings for this horse
  const { data: markings } = await supabase
    .from('horse_markings')
    .select('*')
    .eq('horse_id', horseId)

  console.log('═'.repeat(80))
  console.log(`🏇 CABALLO: ${horse?.name || 'Desconocido'}`)
  console.log('═'.repeat(80))

  if (horse) {
    console.log(`\n📋 Información:`)
    console.log(`   Raza:  ${horse.raza || '—'}`)
    console.log(`   Madre: ${horse.madre || '—'}`)
  }

  console.log(`\n🎯 Marcas Corporales (${markings?.length || 0}):`)
  if (markings && markings.length > 0) {
    markings.forEach((mark, idx) => {
      console.log(`   ${idx + 1}. Parte: ${mark.mark_part_id || '—'}`)
      if (mark.text1) console.log(`      • ${mark.text1}`)
      if (mark.text2) console.log(`      • ${mark.text2}`)
    })
  }

  console.log('\n' + '═'.repeat(80) + '\n')
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
