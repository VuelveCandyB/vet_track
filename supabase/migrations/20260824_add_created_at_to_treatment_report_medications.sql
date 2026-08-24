-- Add created_at column to treatment_report_medications for audit trail
alter table treatment_report_medications add column created_at timestamptz default now();

-- Create index for faster queries
create index if not exists idx_treatment_report_medications_created_at
  on treatment_report_medications(created_at);
