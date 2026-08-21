create table public.vaccine_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  validity_days integer not null default 365,
  warning_days integer not null default 30,
  required boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.vaccine_types enable row level security;

create policy "auth_read_vaccine_types" on public.vaccine_types
  for select using (true);

create policy "auth_write_vaccine_types" on public.vaccine_types
  for all using (true);

create index vaccine_types_active_sort_idx on public.vaccine_types(active, sort_order);

-- Seed with 8 vaccine types
insert into public.vaccine_types (name, required, validity_days, warning_days, sort_order) values
  ('Rabia', true, 365, 30, 1),
  ('Tetanus toxoid', true, 365, 30, 2),
  ('West Nile virus', true, 365, 30, 3),
  ('Rhinopneumonitis', true, 365, 30, 4),
  ('Influenza', true, 365, 30, 5),
  ('Eastern Equine Encephalitis', false, 365, 30, 6),
  ('Western Equine Encephalitis', false, 365, 30, 7),
  ('Venezuelan Equine Encephalitis', false, 365, 30, 8);
