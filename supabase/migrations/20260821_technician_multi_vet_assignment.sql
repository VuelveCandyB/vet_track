-- Relación N:N técnico↔médico (reemplaza profiles.supervising_vet_id)
create table technician_supervisors (
  technician_id uuid not null references auth.users(id) on delete cascade,
  vet_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (technician_id, vet_id)
);
create index idx_technician_supervisors_vet on technician_supervisors(vet_id);

-- Backfill desde la columna única existente
insert into technician_supervisors (technician_id, vet_id)
select id, supervising_vet_id from profiles
where supervising_vet_id is not null
on conflict do nothing;

-- Médico activo del técnico (elegido al login / cambiable en cualquier momento)
alter table profiles add column active_vet_id uuid references auth.users(id);

-- Si el técnico solo tiene un médico asignado, se activa automáticamente
update profiles p
set active_vet_id = ts.vet_id
from (
  select technician_id, min(vet_id) as vet_id
  from technician_supervisors
  group by technician_id
  having count(*) = 1
) ts
where p.id = ts.technician_id;

-- La columna única queda reemplazada por la tabla de relación
alter table profiles drop column supervising_vet_id;

-- Cada informe de tratamiento queda ligado al médico para el que se creó
alter table treatment_reports add column created_for_vet_id uuid references auth.users(id);
create index idx_treatment_reports_created_for_vet on treatment_reports(created_for_vet_id);

-- Backfill de informes existentes: técnicos → su médico (si tenían uno solo), vets → ellos mismos
update treatment_reports tr
set created_for_vet_id = coalesce(
  (select vet_id from technician_supervisors ts where ts.technician_id = tr.created_by limit 1),
  tr.created_by
)
where created_for_vet_id is null;
