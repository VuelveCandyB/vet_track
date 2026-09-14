create table if not exists public.horse_alternate_microchips (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid not null references public.horses(id) on delete cascade,
  microchip text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_horse_alt_microchips_horse on public.horse_alternate_microchips(horse_id);
create index idx_horse_alt_microchips_chip on public.horse_alternate_microchips(microchip);
