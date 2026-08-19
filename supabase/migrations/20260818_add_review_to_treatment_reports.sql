-- Add technician supervision tracking to profiles
alter table profiles
  add column supervising_vet_id uuid references auth.users(id);

create index idx_profiles_supervising_vet on profiles(supervising_vet_id);

-- Add treatment review tracking to treatment_reports
alter table treatment_reports
  add column reviewed_by uuid references auth.users(id),
  add column reviewed_at timestamptz;

create index idx_treatment_reports_reviewed_by on treatment_reports(reviewed_by);
