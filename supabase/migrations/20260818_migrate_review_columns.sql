-- Move review columns from medications to treatment_reports

-- First, drop the old indexes and columns from medications
drop index if exists idx_medications_reviewed_by;
alter table medications
  drop column if exists reviewed_at,
  drop column if exists reviewed_by;

-- Add review columns to treatment_reports if they don't exist
alter table treatment_reports
  add column reviewed_by uuid references auth.users(id),
  add column reviewed_at timestamptz;

create index idx_treatment_reports_reviewed_by on treatment_reports(reviewed_by);
