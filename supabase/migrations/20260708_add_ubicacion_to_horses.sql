-- Add ubicacion (location/stable) field to horses table
-- Synced from crioonline GroupOfHorses data

ALTER TABLE horses
ADD COLUMN ubicacion VARCHAR(255) NULL;

-- Create index for ubicacion lookups
CREATE INDEX idx_horses_ubicacion ON horses(ubicacion);
