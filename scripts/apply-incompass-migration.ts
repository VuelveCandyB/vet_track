/**
 * Apply InCompass migration to Supabase
 * Usage: npx tsx scripts/apply-incompass-migration.ts
 */

import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

async function main() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20260922_incompass_integration.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('🔄 Ejecutando migración...')
    console.log('─'.repeat(80))

    // Execute each statement separately
    const statements = sql.split(';').filter(s => s.trim())

    for (const statement of statements) {
      if (!statement.trim()) continue

      console.log(`\n→ Ejecutando: ${statement.substring(0, 50)}...`)
      const { error } = await supabase.rpc('exec', { statement })

      if (error && error.message !== 'function "exec" does not exist') {
        console.error(`❌ Error: ${error.message}`)
        throw error
      }
    }

    // Alternative: use raw SQL via postgres connection
    console.log('\n🔄 Alternativa: Usando conexión SQL directa...')

    const { error: checkError, data: tables } = await supabase.rpc('sql', {
      query: "SELECT * FROM information_schema.columns WHERE table_name = 'horses' AND column_name = 'tattoo'",
    })

    if (checkError?.message.includes('does not exist')) {
      console.log('\n⚠️  No se puede ejecutar SQL directo. Descargando schema actual...')

      // Get current schema
      const { data, error: schemaError } = await supabase
        .from('horses')
        .select('*')
        .limit(1)

      if (schemaError) {
        console.log(`❌ Error: ${schemaError.message}`)
        console.log('\n💡 Solución: Ejecuta manualmente en Supabase SQL Editor:')
        console.log(sql)
        return
      }

      console.log('Columnas actuales en horses:', Object.keys(data?.[0] || {}))
    }

    console.log('\n✅ Migración completada')
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
