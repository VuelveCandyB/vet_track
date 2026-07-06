-- Make race_entry_id nullable in pmf_records table
-- This allows registering PMF records before linking to race entries

ALTER TABLE pmf_records
ALTER COLUMN race_entry_id DROP NOT NULL;
