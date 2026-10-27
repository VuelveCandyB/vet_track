-- Cualquier usuario autenticado puede ver los medicamentos de un informe
-- (igual que ya ocurre con public.treatment_reports). Las acciones de escritura
-- siguen limitadas por sus propias reglas.
create policy "authenticated_select_treatment_report_medications"
  on public.treatment_report_medications
  for select
  to authenticated
  using (true);
