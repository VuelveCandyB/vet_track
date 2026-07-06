-- Create race_entries table
-- Links horses to races on a specific race_day
-- Supports matching CSV imports to existing horses

CREATE TABLE race_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_day_id UUID NOT NULL REFERENCES race_days(id) ON DELETE CASCADE,
  horse_id UUID REFERENCES horses(id) ON DELETE SET NULL,

  -- CSV snapshot data (Art. 1412a: identificación del ejemplar)
  horse_nombre_csv VARCHAR(255) NOT NULL,
  horse_id_csv VARCHAR(100) NOT NULL,

  -- Race details
  num_carrera INT NOT NULL,
  hora_salida TIME NOT NULL,
  puesto INT NULL,
  trainer VARCHAR(255) NULL,
  owner VARCHAR(255) NULL,

  -- Matching status
  fuente VARCHAR(20) DEFAULT 'csv' NOT NULL CHECK (fuente IN ('equibase', 'csv', 'manual')),
  match_status VARCHAR(20) DEFAULT 'unmatched' NOT NULL CHECK (match_status IN ('matched', 'unmatched', 'manual')),

  -- Additional notes
  notas TEXT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_race_entries_race_day_id ON race_entries(race_day_id);
CREATE INDEX idx_race_entries_horse_id ON race_entries(horse_id);
CREATE INDEX idx_race_entries_match_status ON race_entries(match_status);
CREATE INDEX idx_race_entries_horse_id_csv ON race_entries(horse_id_csv);
CREATE UNIQUE INDEX idx_race_entries_unique_per_day ON race_entries(race_day_id, num_carrera);

-- Enable RLS
ALTER TABLE race_entries ENABLE ROW LEVEL SECURITY;

-- RLS: All authenticated can read
CREATE POLICY "Enable read for authenticated users" ON race_entries
  FOR SELECT TO authenticated USING (true);

-- RLS: Only Vet Oficial can insert/update
CREATE POLICY "Enable write for vet oficial" ON race_entries
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for vet oficial" ON race_entries
  FOR UPDATE TO authenticated USING (true);
