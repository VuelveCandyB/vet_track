-- Create horse_referidos table to track referral history (replaces overwritten red_flag concept)
create table horse_referidos (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid not null references horses(id) on delete cascade,
  motivo text not null,
  marcado_por text,
  fecha_marcado timestamptz not null default now(),
  fecha_resuelto timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Index for efficient lookups by horse
create index idx_horse_referidos_horse on horse_referidos(horse_id);

-- Backfill: if horse has current red_flag, create initial history entry
insert into horse_referidos (horse_id, motivo, marcado_por, fecha_marcado)
select id, coalesce(red_flag_reason, 'Sin motivo'), red_flag_by, coalesce(red_flag_date, now())
from horses
where red_flag = true;
