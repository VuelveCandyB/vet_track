import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { searchIncompassHorse } from '@/lib/incompass'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const microchip = '981020051033850'

  console.log(`\n🔍 INVESTIGANDO CABALLO CON MICROCHIP: ${microchip}\n`)

  // Check in DB
  const { data: dbHorse } = await supabase
    .from('horses')
    .select('*')
    .eq('microchip', microchip)
    .single()

  console.log('📋 DATOS EN BASE DE DATOS:')
  if (dbHorse) {
    console.log(`  ID: ${dbHorse.id}`)
    console.log(`  Nombre: "${dbHorse.name || '(VACÍO)"'}`)
    console.log(`  Microchip: ${dbHorse.microchip}`)
    console.log(`  Raza: ${dbHorse.raza || '—'}`)
    console.log(`  Madre: ${dbHorse.madre || '—'}`)
    console.log(`  Tattoo: ${dbHorse.tattoo || '—'}`)
    console.log(`  Status: ${dbHorse.status}`)
    console.log(`  Creado: ${dbHorse.created_at}`)
  } else {
    console.log('  ❌ NO ENCONTRADO EN BD')
  }

  // Check in InCompass
  console.log(`\n📥 BÚSQUEDA EN INCOMPASS API:`)
  const result = await searchIncompassHorse(microchip)

  if (result.found && result.data) {
    console.log(`  Nombre: ${result.data.horseName}`)
    console.log(`  Registro: ${result.data.registrationNumber}`)
    console.log(`  Raza: ${result.data.breed}`)
    console.log(`  Madre: ${result.data.dam?.horseName || '—'}`)
    console.log(`  Tattoo: ${result.data.tattoo || '—'}`)
  } else {
    console.log(`  ❌ NO ENCONTRADO EN INCOMPASS`)
  }

  console.log('\n' + '═'.repeat(80))
  if (dbHorse && !dbHorse.name) {
    console.log('\n⚠️  PROBLEMA: Caballo en BD sin nombre')
    if (result.found && result.data) {
      console.log(`   InCompass tiene el nombre: "${result.data.horseName}"`)
      console.log(`   Debería sincronizarse manualmente o revisar por qué no se actualizó`)
    }
  }
  console.log()
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
