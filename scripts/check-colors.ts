import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Credentials not found')
    return
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data, error } = await supabase
    .from('horses')
    .select('color')
    .not('color', 'is', null)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!data) {
    console.log('No data returned')
    return
  }

  const colorCounts: Record<string, number> = {}
  data.forEach(row => {
    if (row.color) {
      colorCounts[row.color] = (colorCounts[row.color] || 0) + 1
    }
  })

  const colors = Object.keys(colorCounts).sort()

  console.log('\n📊 Colores únicos encontrados en la BD:')
  console.log('═'.repeat(60))

  colors.forEach(color => {
    console.log(`  • ${color} (${colorCounts[color]} registros)`)
  })

  console.log('═'.repeat(60))
  console.log(`Total de colores únicos: ${colors.length}`)
  console.log(`Total de registros con color: ${data.length}\n`)
}

main()
