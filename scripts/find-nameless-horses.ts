import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Count nameless horses
  const { count } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .or('name.is.null,name.eq.""')

  // Get samples
  const { data: samples } = await supabase
    .from('horses')
    .select('id, microchip, raza, madre, registration, status')
    .eq('status', 'active')
    .or('name.is.null,name.eq.""')
    .limit(15)

  console.log('\n🔍 CABALLOS SIN NOMBRE EN LA BD\n')
  console.log(`📊 Total encontrados: ${count || 0}`)
  console.log(`\n📋 Primeros 15 ejemplos:\n`)

  samples?.forEach((h: any, i) => {
    console.log(`${i+1}. Microchip: ${h.microchip}`)
    console.log(`   Registro: ${h.registration || '—'}`)
    console.log(`   Raza: ${h.raza || '—'} | Madre: ${h.madre || '—'}`)
  })

  console.log('\n' + '═'.repeat(80))
  console.log('\n⚠️  Estos caballos tienen microchip y datos desde InCompass,')
  console.log('   pero sus nombres vienen VACÍOS de la API.')
  console.log('   Probablemente hay un problema en InCompass con estos registros.\n')
}

main()
