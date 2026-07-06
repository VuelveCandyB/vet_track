-- Add unique constraint to prevent duplicate PMF records for the same race entry
ALTER TABLE pmf_records
ADD CONSTRAINT unique_race_entry_pmf UNIQUE (race_entry_id);
