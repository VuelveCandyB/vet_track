/**
 * Check InCompass sync results
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

  // Count horses with InCompass data
  const { count: withInCompass } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('tattoo', 'is', null)

  // Count horses with markings
  const { data: markingsData } = await supabase
    .from('horse_markings')
    .select('horse_id')
  const horsesWithMarkingsSet = new Set(markingsData?.map(m => m.horse_id) || [])
  const horsesWithMarkingsCount = horsesWithMarkingsSet.size

  const { count: horsesWithRaza } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('raza', 'is', null)

  const { count: horsesWithMadre } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('madre', 'is', null)

  console.log('\n📊 RESULTADOS DE SINCRONIZACIÓN:')
  console.log(`  Con tattoo (InCompass):  ${withInCompass}`)
  console.log(`  Con raza:                ${horsesWithRaza}`)
  console.log(`  Con madre:               ${horsesWithMadre}`)
  console.log(`  Con marcas corporales:   ${horsesWithMarkingsCount}`)
  console.log()
}

main()
