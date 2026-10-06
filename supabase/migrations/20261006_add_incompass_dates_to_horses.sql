-- Add lastWorkedDate and lastRaceDate fields from InCompass API
ALTER TABLE horses
ADD COLUMN IF NOT EXISTS last_worked_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_race_date date DEFAULT NULL;

-- Add comments to clarify the source
COMMENT ON COLUMN horses.last_worked_date IS 'Last date the horse worked, synced from InCompass API';
COMMENT ON COLUMN horses.last_race_date IS 'Last date the horse raced, synced from InCompass API';
