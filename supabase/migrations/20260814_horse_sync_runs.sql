-- Table to track horse sync runs for resumible, persistent job tracking
create table horse_sync_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running' check (status in ('running', 'completed', 'paused', 'failed')),
  total_pages int,
  current_page int not null default 0,
  pages_ok int not null default 0,
  pages_failed int not null default 0,
  inserted int not null default 0,
  updated int not null default 0,
  renamed int not null default 0,
  chips_completados int not null default 0,
  errors jsonb not null default '[]'::jsonb,
  triggered_by text not null default 'manual' check (triggered_by in ('manual', 'cron')),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index on horse_sync_runs (status, started_at desc);
create index on horse_sync_runs (triggered_by, created_at desc);
