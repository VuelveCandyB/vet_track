/**
 * Apply migration directly to Supabase PostgreSQL
 * Usage: npx tsx scripts/apply-migration-direct.ts
 */

import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import postgres from 'postgres'
import { readFileSync } from 'fs'

async function main() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL not set')

    // Extract host from URL: https://iutzdscrtwdguhamobpu.supabase.co
    const projectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
    const host = `${projectId}.supabase.co`
    const password = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!password) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')

    console.log(`🔄 Conectando a Supabase: ${host}`)
    console.log('─'.repeat(80))

    // Connect using postgres client
    const sql = postgres({
      host,
      port: 5432,
      database: 'postgres',
      username: 'postgres',
      password,
      ssl: 'require',
    })

    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20260922_incompass_integration.sql')
    const migrationSql = readFileSync(migrationPath, 'utf-8')

    // Split by semicolon and execute each statement
    const statements = migrationSql.split(';').filter(s => s.trim()).map(s => s.trim())

    console.log(`\n📝 Ejecutando ${statements.length} statements...\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`[${i + 1}/${statements.length}] ${statement.substring(0, 60)}...`)

      try {
        await sql.unsafe(statement)
        console.log(`      ✓ OK\n`)
      } catch (err) {
        const error = err as any
        console.log(`      ✗ Error: ${error.message}\n`)
      }
    }

    console.log('─'.repeat(80))
    console.log('✅ Migración completada')

    await sql.end()
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
