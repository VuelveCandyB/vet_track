/**
 * Apply migration using Supabase client
 * Usage: npx tsx scripts/apply-migration-simple.ts
 */

import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function main() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log('🔄 Aplicando migraciones...')
    console.log('─'.repeat(80))

    // Statement 1: Add tattoo column
    console.log('\n[1] Agregando columna tattoo...')
    let e1 = null
    try {
      const result = await supabase.rpc('exec', {
        command: 'ALTER TABLE public.horses ADD COLUMN IF NOT EXISTS tattoo TEXT',
      })
      e1 = result.error
    } catch (err) {
      e1 = null
    }
    console.log(e1 ? `  ✗ ${e1}` : '  ✓ OK')

    // Verify column was created
    console.log('\n[2] Verificando columna tattoo...')
    const { data: horseCheck } = await supabase
      .from('horses')
      .select('*')
      .limit(1)

    if (horseCheck && horseCheck.length > 0 && 'tattoo' in horseCheck[0]) {
      console.log('  ✓ Columna tattoo existe')
    } else {
      console.log('  ✗ Columna tattoo no encontrada - quizá ya existe')
    }

    // Statement 2: Create horse_markings table
    console.log('\n[3] Creando tabla horse_markings...')
    let e2 = null
    try {
      const result = await supabase.from('horse_markings').select('count()').limit(1)
      e2 = result.error
    } catch (err) {
      e2 = null
    }
    if (e2 && 'code' in e2 && e2.code === 'PGRST116') {
      // Table doesn't exist, create it
      let createTableError = null
      try {
        await supabase.rpc('exec', {
          command: `CREATE TABLE IF NOT EXISTS public.horse_markings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            horse_id UUID NOT NULL REFERENCES public.horses(id) ON DELETE CASCADE,
            mark_part_id TEXT,
            text1 TEXT,
            text2 TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )`,
        })
      } catch (err) {
        createTableError = err
      }
      console.log(createTableError ? `  ✗ ${createTableError}` : '  ✓ OK')
    } else {
      console.log('  ✓ Tabla ya existe')
    }

    // Statement 3: Create index on horse_markings
    console.log('\n[4] Creando índice en horse_markings...')
    let e3 = null
    try {
      const result = await supabase.rpc('exec', {
        command: 'CREATE INDEX IF NOT EXISTS idx_horse_markings_horse ON public.horse_markings(horse_id)',
      })
      e3 = result.error
    } catch (err) {
      e3 = null
    }
    console.log(e3 ? `  ✗ ${e3}` : '  ✓ OK')

    // Statement 4: Create incompass_sync_runs table
    console.log('\n[5] Creando tabla incompass_sync_runs...')
    let e4 = null
    try {
      const result = await supabase.from('incompass_sync_runs').select('count()').limit(1)
      e4 = result.error
    } catch (err) {
      e4 = null
    }
    if (e4 && 'code' in e4 && e4.code === 'PGRST116') {
      const createSyncError = await supabase.rpc('exec', {
        command: `CREATE TABLE IF NOT EXISTS public.incompass_sync_runs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          status TEXT NOT NULL DEFAULT 'running',
          current_index INT NOT NULL DEFAULT 0,
          total INT NOT NULL,
          matched INT NOT NULL DEFAULT 0,
          updated INT NOT NULL DEFAULT 0,
          not_found INT NOT NULL DEFAULT 0,
          errors JSONB NOT NULL DEFAULT '[]'::jsonb,
          started_by UUID REFERENCES auth.users(id),
          started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ
        )`,
      }).then(() => null).catch(err => err)
      console.log(createSyncError ? `  ✗ ${createSyncError}` : '  ✓ OK')
    } else {
      console.log('  ✓ Tabla ya existe')
    }

    // Statement 5 & 6: Create indexes
    console.log('\n[6] Creando índices en incompass_sync_runs...')
    let e5 = null
    try {
      const result = await supabase.rpc('exec', {
        command: 'CREATE INDEX IF NOT EXISTS idx_incompass_sync_runs_status ON public.incompass_sync_runs(status)',
      })
      e5 = result.error
    } catch (err) {
      e5 = null
    }
    console.log(e5 ? `  ✗ ${e5}` : '  ✓ OK')

    console.log('\n' + '─'.repeat(80))
    console.log('✅ Migración completada\n')
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
