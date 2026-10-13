-- Restrict writes on horse_alternate_microchips to the roles allowed by
-- PERMISSIONS['horses.microchip_alternate'] (lib/permissions.ts):
-- authorized_vet, official_vet, director, technician, plus admin (email or user_roles row).
-- Reads stay open to authenticated users: the horse profile shows these microchips to everyone who can view horses.

drop policy if exists allow_authenticated_insert on public.horse_alternate_microchips;
drop policy if exists allow_authenticated_update on public.horse_alternate_microchips;
drop policy if exists allow_authenticated_delete on public.horse_alternate_microchips;

create policy alt_microchips_insert on public.horse_alternate_microchips
  for insert to authenticated
  with check (
    coalesce(auth.jwt() ->> 'email', '') = 'admin@admin.com'
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'authorized_vet', 'official_vet', 'director', 'technician')
    )
  );

create policy alt_microchips_update on public.horse_alternate_microchips
  for update to authenticated
  using (
    coalesce(auth.jwt() ->> 'email', '') = 'admin@admin.com'
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'authorized_vet', 'official_vet', 'director', 'technician')
    )
  )
  with check (
    coalesce(auth.jwt() ->> 'email', '') = 'admin@admin.com'
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'authorized_vet', 'official_vet', 'director', 'technician')
    )
  );

create policy alt_microchips_delete on public.horse_alternate_microchips
  for delete to authenticated
  using (
    coalesce(auth.jwt() ->> 'email', '') = 'admin@admin.com'
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'authorized_vet', 'official_vet', 'director', 'technician')
    )
  );
