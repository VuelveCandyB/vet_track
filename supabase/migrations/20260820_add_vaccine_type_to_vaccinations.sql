alter table public.vaccinations
  add column vaccine_type_id uuid references public.vaccine_types(id);

create index vaccinations_vaccine_type_id_idx on public.vaccinations(horse_id, vaccine_type_id);
