-- Add withdrawal_time_dias column to drugs table
ALTER TABLE drugs
ADD COLUMN withdrawal_time_dias numeric(5, 2) GENERATED ALWAYS AS (
  CASE
    WHEN withdrawal_time_horas IS NOT NULL AND withdrawal_time_horas > 0
    THEN ROUND(withdrawal_time_horas::numeric / 24 * 10) / 10
    ELSE NULL
  END
) STORED;

-- Create index for performance if needed
CREATE INDEX idx_drugs_withdrawal_time_dias ON drugs(withdrawal_time_dias);
