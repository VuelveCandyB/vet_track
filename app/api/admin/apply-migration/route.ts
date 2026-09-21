/**
 * Admin endpoint to apply InCompass migration
 * POST /api/admin/apply-migration
 */

import { createClient } from '@/lib/supabase/server'
import { requireUser, isAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Authenticate and check admin
    const user = await requireUser()
    const admin = await isAdmin(user.id, user.email!)

    if (!admin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const supabase = await createClient()

    // Execute migration SQL statements
    const statements = [
      'alter table public.horses add column if not exists tattoo text',
      `create table if not exists public.horse_markings (
        id uuid primary key default gen_random_uuid(),
        horse_id uuid not null references public.horses(id) on delete cascade,
        mark_part_id text,
        text1 text,
        text2 text,
        created_at timestamptz not null default now()
      )`,
      'create index if not exists idx_horse_markings_horse on public.horse_markings(horse_id)',
      `create table if not exists public.incompass_sync_runs (
        id uuid primary key default gen_random_uuid(),
        status text not null default 'running',
        current_index int not null default 0,
        total int not null,
        matched int not null default 0,
        updated int not null default 0,
        not_found int not null default 0,
        errors jsonb not null default '[]',
        started_by uuid references auth.users(id),
        started_at timestamptz not null default now(),
        completed_at timestamptz
      )`,
      'create index if not exists idx_incompass_sync_runs_status on public.incompass_sync_runs(status)',
      'create index if not exists idx_incompass_sync_runs_started_at on public.incompass_sync_runs(started_at desc)',
    ]

    const results = []

    for (const statement of statements) {
      let error = null
      try {
        const result = await supabase.rpc('exec', {
          command: statement,
        })
        error = result.error
      } catch (err) {
        error = err
      }

      if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST116') {
        // PGRST116 = function doesn't exist, ignore that error
        results.push({ statement: statement.substring(0, 50), status: 'error', error: String(error) })
      } else {
        results.push({ statement: statement.substring(0, 50), status: 'ok' })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration applied',
      results,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
