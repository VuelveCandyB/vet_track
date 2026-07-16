-- Add veterinarian-specific columns to profiles
alter table profiles
  add column license_number text,
  add column license_renewal_date date,
  add column phone1 text,
  add column phone2 text;

-- Create indexes for faster queries
create index idx_profiles_license_number on profiles(license_number);
