/**
 * Audit nameless horses - are they duplicates or orphaned records?
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
  console.log('🔍 AUDITORÍA: ¿ESTÁN DEMÁS LOS 29 CABALLOS SIN NOMBRE?')
  console.log('═'.repeat(80) + '\n')

  // Get counts
  const { count: totalCount } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })

  const { count: activeCount } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: withNameCount } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('name', 'is', null)
    .not('name', 'eq', '""')

  const { count: namelessCount } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .or('name.is.null,name.eq.""')

  console.log('📊 CONTEO GENERAL:')
  console.log(`  Total caballos en BD:           ${totalCount}`)
  console.log(`  Caballos activos:               ${activeCount}`)
  console.log(`  Activos CON nombre:             ${withNameCount}`)
  console.log(`  Activos SIN nombre:             ${namelessCount}`)
  console.log()

  // Check for duplicate microchips
  const { data: allHorses } = await supabase
    .from('horses')
    .select('id, microchip, name, status')
    .eq('status', 'active')

  const microchipMap = new Map<string, any[]>()
  allHorses?.forEach(h => {
    const key = String(h.microchip).trim()
    if (!microchipMap.has(key)) {
      microchipMap.set(key, [])
    }
    microchipMap.get(key)!.push(h)
  })

  const duplicates = Array.from(microchipMap.entries()).filter(([_, horses]) => horses.length > 1)

  console.log('🔁 BÚSQUEDA DE DUPLICADOS:')
  console.log(`  Microchips únicos:              ${microchipMap.size}`)
  console.log(`  Microchips duplicados:          ${duplicates.length}`)

  if (duplicates.length > 0) {
    console.log('\n  Duplicados encontrados:')
    duplicates.slice(0, 5).forEach(([chip, horses]) => {
      console.log(`    - ${chip}: ${horses.length} registros`)
      horses.forEach(h => {
        console.log(`      • ${h.id.slice(0, 8)}... "${h.name || '(vacío)'}"`)
      })
    })
    if (duplicates.length > 5) {
      console.log(`    ... y ${duplicates.length - 5} más`)
    }
  } else {
    console.log('  ✅ No hay duplicados de microchip')
  }

  // Get the 29 nameless horses
  const { data: namelessHorses } = await supabase
    .from('horses')
    .select('id, microchip, raza, madre, registration, created_at, crio_id')
    .eq('status', 'active')
    .or('name.is.null,name.eq.""')

  console.log('\n📋 ANÁLISIS DE LOS 29 SIN NOMBRE:')
  console.log(`  Tienen microchip:              ${namelessHorses?.filter(h => h.microchip).length || 0}/29`)
  console.log(`  Tienen raza:                   ${namelessHorses?.filter(h => h.raza).length || 0}/29`)
  console.log(`  Tienen madre:                  ${namelessHorses?.filter(h => h.madre).length || 0}/29`)
  console.log(`  Tienen registro:               ${namelessHorses?.filter(h => h.registration).length || 0}/29`)
  console.log(`  Tienen crio_id:                ${namelessHorses?.filter(h => h.crio_id).length || 0}/29`)

  // Check if any orphaned
  const orphaned = namelessHorses?.filter(h => !h.microchip && !h.crio_id) || []

  console.log('\n⚠️  CABALLOS HUÉRFANOS (sin microchip ni crio_id):')
  console.log(`  Total: ${orphaned.length}`)
  orphaned.forEach(h => {
    console.log(`    - ${h.id.slice(0, 8)}... (raza: ${h.raza}, madre: ${h.madre})`)
  })

  console.log('\n' + '═'.repeat(80))
  console.log('\n📝 CONCLUSIÓN:')

  if (duplicates.length > 0) {
    console.log('  ⚠️  Hay duplicados de microchip - revisar')
  }

  if (orphaned.length > 0) {
    console.log(`  ⚠️  ${orphaned.length} caballos SIN microchip ni crio_id - podrían ser registros incompletos/demás`)
  } else {
    console.log('  ✅ Los 29 caballos sin nombre tienen microchip/crio_id - son registros válidos, solo faltan nombres')
  }

  if (namelessCount === 29 && duplicates.length === 0) {
    console.log('  ✅ NO están demás - tienen datos (raza, madre, registro)')
    console.log('  ℹ️  Solo necesitan nombres desde una fuente alternativa\n')
  }
}

main()
