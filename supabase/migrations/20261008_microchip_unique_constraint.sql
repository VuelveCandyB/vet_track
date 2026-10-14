-- The sync upserts with ON CONFLICT (microchip), which Postgres cannot infer
-- from a partial unique index. Replace it with a full UNIQUE constraint.
-- NULLs are distinct in Postgres unique constraints, so horses without a
-- microchip are still allowed.
DROP INDEX IF EXISTS idx_horses_microchip_unique;

ALTER TABLE horses
ADD CONSTRAINT horses_microchip_key UNIQUE (microchip);
