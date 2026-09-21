/**
 * Set placeholder names for horses without official names
 * Updates the 29 horses that don't have names in CRIO or InCompass
 */

import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('\n' + '═'.repeat(80))
  console.log('🏷️  ASIGNANDO NOMBRES OFICIALES A POTROS SIN NOMBRE')
  console.log('═'.repeat(80) + '\n')

  // Get nameless horses
  const { data: namelessHorses } = await supabase
    .from('horses')
    .select('id, microchip, madre')
    .eq('status', 'active')
    .or('name.is.null,name.eq.""')

  if (!namelessHorses || namelessHorses.length === 0) {
    console.log('✅ No hay caballos sin nombre\n')
    return
  }

  console.log(`📊 Encontrados: ${namelessHorses.length} caballos sin nombre\n`)
  console.log('🔄 Asignando nombres...\n')

  let updated = 0
  const placeholderName = 'Potro - Sin Nombre Oficial'

  for (const horse of namelessHorses) {
    const { error } = await supabase
      .from('horses')
      .update({ name: placeholderName })
      .eq('id', horse.id)

    if (!error) {
      console.log(`✓ ${horse.microchip} → "${placeholderName}"`)
      updated++
    } else {
      console.log(`✗ ${horse.microchip} - Error: ${error.message}`)
    }
  }

  console.log('\n' + '═'.repeat(80))
  console.log(`\n✅ Nombres asignados: ${updated}/${namelessHorses.length}\n`)
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
