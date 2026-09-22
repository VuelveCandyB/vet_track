/**
 * Normalize horse colors from InCompass abbreviations to standardized codes
 * Updates all existing color values in the horses table
 */

import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { mapColorCode } from '@/lib/incompass'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  console.log('\n🎨 NORMALIZANDO COLORES DE CABALLOS')
  console.log('═'.repeat(60))

  // Get all horses with colors
  const { data: horses, error } = await supabase
    .from('horses')
    .select('id, name, color')
    .not('color', 'is', null)

  if (error || !horses) {
    console.error('❌ Error fetching horses:', error?.message)
    process.exit(1)
  }

  console.log(`📊 Total de caballos con color: ${horses.length}\n`)

  const updates: Array<{ id: string; name: string; old: string; new: string | null }> = []
  const unchanged: Array<{ id: string; name: string; color: string }> = []

  // Process each horse
  for (const horse of horses) {
    const mapped = mapColorCode(horse.color)

    if (mapped && mapped !== horse.color) {
      updates.push({
        id: horse.id,
        name: horse.name,
        old: horse.color,
        new: mapped,
      })
    } else if (!mapped) {
      console.log(`⚠️  ${horse.name}: No se pudo mapear "${horse.color}"`)
    } else {
      unchanged.push({
        id: horse.id,
        name: horse.name,
        color: horse.color,
      })
    }
  }

  if (updates.length === 0) {
    console.log('✅ Todos los colores ya están normalizados\n')
    return
  }

  console.log(`🔄 Se actualizarán ${updates.length} caballos`)
  console.log(`✅ ${unchanged.length} caballos ya tienen color normalizado\n`)

  console.log('Cambios a realizar:')
  console.log('─'.repeat(60))
  updates.slice(0, 10).forEach(u => {
    console.log(`  ${u.name}: "${u.old}" → "${u.new}"`)
  })
  if (updates.length > 10) {
    console.log(`  ... y ${updates.length - 10} más`)
  }
  console.log('─'.repeat(60) + '\n')

  // Update horses
  let updated = 0
  let errors = 0

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('horses')
      .update({ color: update.new })
      .eq('id', update.id)

    if (updateError) {
      console.error(`  ✗ ${update.name}: ${updateError.message}`)
      errors++
    } else {
      updated++
    }
  }

  console.log('\n✅ Normalización completada')
  console.log(`  • Actualizados: ${updated}`)
  console.log(`  • Errores: ${errors}`)
  console.log(`  • Sin cambios: ${unchanged.length}\n`)
}

main()
