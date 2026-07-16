create table public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid not null references public.horses(id),
  vet_name text not null,
  fecha date not null default current_date,
  notas text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.vaccinations enable row level security;

create policy "allow_select_vaccinations" on public.vaccinations
  for select using (true);

create policy "allow_insert_vaccinations" on public.vaccinations
  for insert with check (auth.uid() = created_by);

create index vaccinations_horse_id_idx on public.vaccinations(horse_id);
create index vaccinations_fecha_idx on public.vaccinations(fecha desc);
