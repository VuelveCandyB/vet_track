-- Create race_days table for Vet Oficial to manage daily race schedules
-- Art. 809: Hora de Retiros y Cambios

CREATE TABLE race_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE UNIQUE NOT NULL,
  hora_retiros TIME,
  total_carreras INT,
  estado VARCHAR(20) DEFAULT 'borrador' NOT NULL CHECK (estado IN ('borrador', 'activo', 'cerrado')),
  fuente VARCHAR(20) DEFAULT 'manual' NOT NULL CHECK (fuente IN ('equibase', 'csv', 'manual')),
  creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_race_days_fecha ON race_days(fecha);
CREATE INDEX idx_race_days_estado ON race_days(estado);
CREATE INDEX idx_race_days_creado_por ON race_days(creado_por);

-- Enable RLS
ALTER TABLE race_days ENABLE ROW LEVEL SECURITY;

-- RLS: All authenticated users can read race_days
CREATE POLICY "Enable read for authenticated users" ON race_days
  FOR SELECT TO authenticated USING (true);

-- RLS: Only Vet Oficial (user.role = 'official_vet' or admin) can insert/update
CREATE POLICY "Enable insert/update for vet oficial" ON race_days
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creado_por);

CREATE POLICY "Enable update for vet oficial" ON race_days
  FOR UPDATE TO authenticated USING (auth.uid() = creado_por);
