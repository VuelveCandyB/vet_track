-- Add horse_id column to pmf_records table
-- This allows linking PMF records directly to horses for proper filtering and display

ALTER TABLE pmf_records
ADD COLUMN horse_id UUID REFERENCES horses(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_pmf_records_horse_id ON pmf_records(horse_id);
