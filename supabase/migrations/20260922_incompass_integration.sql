-- Add tattoo column to horses table
alter table public.horses add column tattoo text;

-- Create horse_markings table for storing markings data from InCompass
create table if not exists public.horse_markings (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid not null references public.horses(id) on delete cascade,
  mark_part_id text,
  text1 text,
  text2 text,
  created_at timestamptz not null default now()
);

create index idx_horse_markings_horse on public.horse_markings(horse_id);

-- Create incompass_sync_runs table for tracking synchronization runs
create table if not exists public.incompass_sync_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running', -- running | completed | failed
  current_index int not null default 0,
  total int not null,
  matched int not null default 0,
  updated int not null default 0,
  not_found int not null default 0,
  errors jsonb not null default '[]',
  started_by uuid references auth.users(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_incompass_sync_runs_status on public.incompass_sync_runs(status);
create index idx_incompass_sync_runs_started_at on public.incompass_sync_runs(started_at desc);
