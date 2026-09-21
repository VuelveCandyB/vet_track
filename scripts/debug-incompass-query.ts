/**
 * Debug: Why did the sync only get 1,000 horses?
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

  console.log('\n🔍 INVESTIGANDO LÍMITE DE QUERY EN INCOMPASS SYNC\n')

  // Query 1: Sin limit (como en el script original)
  console.log('1️⃣ Query sin .limit() (como en full-incompass-sync.ts):')
  const { data: horsesNoLimit, error: errorNoLimit } = await supabase
    .from('horses')
    .select('id, name, microchip, status')
    .eq('status', 'active')
    .not('microchip', 'is', null)
    .order('name')

  console.log(`   Encontrados: ${horsesNoLimit?.length || 0}`)
  if (errorNoLimit) console.log(`   Error: ${errorNoLimit.message}`)

  // Query 2: Con limit explícito de 1000
  console.log('\n2️⃣ Query con .limit(1000):')
  const { data: horsesLimit1000, error: errorLimit1000 } = await supabase
    .from('horses')
    .select('id, name, microchip, status')
    .eq('status', 'active')
    .not('microchip', 'is', null)
    .order('name')
    .limit(1000)

  console.log(`   Encontrados: ${horsesLimit1000?.length || 0}`)
  if (errorLimit1000) console.log(`   Error: ${errorLimit1000.message}`)

  // Query 3: Con limit explícito de 2000
  console.log('\n3️⃣ Query con .limit(2000):')
  const { data: horsesLimit2000, error: errorLimit2000 } = await supabase
    .from('horses')
    .select('id, name, microchip, status')
    .eq('status', 'active')
    .not('microchip', 'is', null)
    .order('name')
    .limit(2000)

  console.log(`   Encontrados: ${horsesLimit2000?.length || 0}`)
  if (errorLimit2000) console.log(`   Error: ${errorLimit2000.message}`)

  // Query 4: Count exact
  console.log('\n4️⃣ Count exact (sin datos, solo count):')
  const { count, error: errorCount } = await supabase
    .from('horses')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('microchip', 'is', null)

  console.log(`   Total: ${count || 0}`)
  if (errorCount) console.log(`   Error: ${errorCount.message}`)

  console.log('\n' + '═'.repeat(80))
  console.log('\n📊 CONCLUSIÓN:')
  console.log(`   - Sin .limit(): ${horsesNoLimit?.length || 0}`)
  console.log(`   - Con .limit(1000): ${horsesLimit1000?.length || 0}`)
  console.log(`   - Con .limit(2000): ${horsesLimit2000?.length || 0}`)
  console.log(`   - Count exacto: ${count || 0}`)

  if ((horsesNoLimit?.length || 0) === 1000 && (count || 0) > 1000) {
    console.log('\n⚠️  PROBLEMA ENCONTRADO:')
    console.log('   Supabase tiene un límite por defecto de 1,000 registros.')
    console.log('   Necesitas agregar .limit() explícitamente al script.')
  }
  console.log()
}

main()
