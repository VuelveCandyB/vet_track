import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
n  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Total de caballos
  const { count: total } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })

  // Caballos activos (status = 'active')
  const { count: active } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Caballos marcados como "No en Crio"
  const { count: noEnCrio } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .not('crio_not_found_since', 'is', null)

  // Caballos con microchip para sincronizar
  const { count: withMicrochip } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .not('microchip', 'is', null)

  console.log(`\n📊 Estado de caballos en BD:`)
  console.log(`  Total:                  ${total}`)
  console.log(`  Activos:                ${active}`)
  console.log(`  No en Crio:             ${noEnCrio}`)
  console.log(`  Con microchip:          ${withMicrochip}`)
  console.log(`  Para sincronizar:       ${(active || 0) - (noEnCrio || 0)}\n`)
}

main()
