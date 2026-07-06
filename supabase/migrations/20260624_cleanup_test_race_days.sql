-- Delete all race_days and cascade delete race_entries
DELETE FROM race_entries WHERE race_day_id IN (SELECT id FROM race_days);
DELETE FROM race_days;
