import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Sample 5 nameless horses
  const { data: nameless } = await supabase
    .from('horses')
    .select('*')
    .eq('status', 'active')
    .or('name.is.null,name.eq.""')
    .limit(3)

  console.log('\n🔍 ANÁLISIS: ¿Siempre estuvieron sin nombre?\n')

  nameless?.forEach((h: any) => {
    console.log(`Microchip: ${h.microchip}`)
    console.log(`  Creado: ${h.created_at}`)
    console.log(`  Nombre actual: "${h.name || '(VACÍO)'}"`)
    console.log(`  Origen: ${h.origin || 'N/A'}`)
    console.log()
  })

  // Count horses that were created BEFORE first sync (these should have original CRIO names)
  const syncDate = new Date('2026-09-21')
  const { data: oldHorses, count: oldCount } = await supabase
    .from('horses')
    .select('id, name, created_at', { count: 'exact' })
    .eq('status', 'active')
    .or('name.is.null,name.eq.""')
    .lt('created_at', syncDate.toISOString())

  console.log('═'.repeat(80))
  console.log(`\n📊 Análisis temporal:\n`)
  console.log(`Caballos sin nombre creados ANTES del sync (2026-09-21):`)
  console.log(`  Total: ${oldCount}\n`)

  console.log(`Conclusión:`)
  console.log(`Si oldCount = 29: Estos caballos NUNCA tuvieron nombre en la BD`)
  console.log(`Si oldCount < 29: Algunos perdieron el nombre durante el import\n`)
}

main()
