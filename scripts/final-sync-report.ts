/**
 * Final InCompass sync report
 * Run this after the full sync completes
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

  console.log('\n' + '═'.repeat(80))
  console.log('📊 REPORTE FINAL DE SINCRONIZACIÓN INCOMPASS')
  console.log('═'.repeat(80) + '\n')

  // Activos totales
  const { count: activeTotalCount } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Activos con microchip
  const { count: activeWithMicrochipCount } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('microchip', 'is', null)

  // Con raza (InCompass data)
  const { count: withBreedCount } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('raza', 'is', null)

  // Con madre
  const { count: withMotherCount } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('madre', 'is', null)

  // Con marcas
  const { data: markingsData } = await supabase
    .from('horse_markings')
    .select('horse_id')
  const uniqueHorsesWithMarkings = new Set(markingsData?.map(m => m.horse_id) || []).size

  // No en CRIO
  const { count: noEncrioCount } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .not('crio_not_found_since', 'is', null)

  const enCrioCount = (activeTotalCount || 0) - (noEncrioCount || 0)

  console.log('🐴 ESTADO GENERAL:')
  console.log(`   Total caballos:              ${activeTotalCount}`)
  console.log(`   Activos en CRIO:             ${enCrioCount}`)
  console.log(`   Activos NO en CRIO:          ${noEncrioCount}`)
  console.log(`   Con microchip:               ${activeWithMicrochipCount}`)

  console.log('\n📥 DATOS SINCRONIZADOS DESDE INCOMPASS:')
  console.log(`   Con raza:                    ${withBreedCount}`)
  console.log(`   Con madre:                   ${withMotherCount}`)
  console.log(`   Con marcas corporales:       ${uniqueHorsesWithMarkings}`)

  const syncedPercentage = ((withBreedCount || 0) / (activeWithMicrochipCount || 1) * 100).toFixed(1)
  console.log(`\n   Porcentaje sincronizado:     ${syncedPercentage}%`)

  console.log('\n' + '═'.repeat(80))
  console.log('✅ Reporte generado\n')
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
