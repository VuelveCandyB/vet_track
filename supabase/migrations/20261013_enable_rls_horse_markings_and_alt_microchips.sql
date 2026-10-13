-- Enable RLS on public tables flagged by Supabase advisor (rls_disabled_in_public).
-- Replaces 20260921_disable_rls_horse_markings.sql: RLS is enabled again, but with
-- policies for authenticated users so the app keeps reading/writing these tables.
-- Anonymous (anon) access is denied. Service-role scripts bypass RLS as usual.

alter table public.horse_markings enable row level security;
alter table public.horse_alternate_microchips enable row level security;

-- horse_markings
create policy allow_authenticated_select on public.horse_markings
  for select to authenticated using (true);
create policy allow_authenticated_insert on public.horse_markings
  for insert to authenticated with check (true);
create policy allow_authenticated_update on public.horse_markings
  for update to authenticated using (true) with check (true);
create policy allow_authenticated_delete on public.horse_markings
  for delete to authenticated using (true);

-- horse_alternate_microchips
create policy allow_authenticated_select on public.horse_alternate_microchips
  for select to authenticated using (true);
create policy allow_authenticated_insert on public.horse_alternate_microchips
  for insert to authenticated with check (true);
create policy allow_authenticated_update on public.horse_alternate_microchips
  for update to authenticated using (true) with check (true);
create policy allow_authenticated_delete on public.horse_alternate_microchips
  for delete to authenticated using (true);
