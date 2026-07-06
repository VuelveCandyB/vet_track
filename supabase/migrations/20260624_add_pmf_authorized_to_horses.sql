-- Add pmf_authorized column to horses table
-- This flag indicates if a horse is authorized for PMF (Furosemide) administration

ALTER TABLE horses
ADD COLUMN pmf_authorized BOOLEAN DEFAULT false;

-- Create index for quick lookups
CREATE INDEX idx_horses_pmf_authorized ON horses(pmf_authorized);
