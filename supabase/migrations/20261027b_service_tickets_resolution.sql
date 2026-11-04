-- Estado, notas y datos de resolución para los tickets SOS.
alter table public.service_tickets
  add column if not exists status text not null default 'pendiente' check (status in ('pendiente','resuelto')),
  add column if not exists notas text,
  add column if not exists resuelto_por uuid,
  add column if not exists resuelto_por_nombre text,
  add column if not exists resuelto_en timestamptz;

-- Lectura: solo quien creó el ticket y los administradores (antes cualquiera podía leer todo).
drop policy if exists service_tickets_select_all on public.service_tickets;
drop policy if exists allow_select_admin on public.service_tickets;

create policy service_tickets_select_own on public.service_tickets
  for select to authenticated
  using (created_by = auth.uid());

create policy service_tickets_select_admin on public.service_tickets
  for select to authenticated
  using (
    (auth.jwt() ->> 'email') = 'admin@admin.com'
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
  );
