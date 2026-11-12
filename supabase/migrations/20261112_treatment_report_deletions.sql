-- Auditoría de informes de tratamiento eliminados (con razón obligatoria).
-- Se escribe con el cliente admin (service role), así que no necesita políticas de INSERT.
create table if not exists public.treatment_report_deletions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  horse_id uuid,
  horse_name text,
  fecha_tratamiento date,
  hora_tratamiento time,
  vet_autorizado_nombre text,
  diagnostico text,
  medications jsonb not null default '[]'::jsonb,
  razon text not null check (char_length(btrim(razon)) >= 10),
  deleted_by uuid,
  deleted_by_nombre text,
  deleted_at timestamptz not null default now()
);

create index if not exists idx_treatment_report_deletions_deleted_at
  on public.treatment_report_deletions (deleted_at desc);

alter table public.treatment_report_deletions enable row level security;

-- Solo administradores pueden leer la auditoría desde la app.
create policy treatment_report_deletions_select_admin on public.treatment_report_deletions
  for select to authenticated
  using (
    (auth.jwt() ->> 'email') = 'admin@admin.com'
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
  );
