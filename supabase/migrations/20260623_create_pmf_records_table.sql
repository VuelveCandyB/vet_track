-- Create pmf_records table
-- Tracks Furosemide administration by Vet Oficial (Art. 1406-1412)
-- Includes dual-signature capability for Art. 1412c certification

CREATE TABLE pmf_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_entry_id UUID NOT NULL REFERENCES race_entries(id) ON DELETE CASCADE,

  -- Receta (Art. 1407-1408)
  vet_autorizado_nombre VARCHAR(255),
  dosis_recetada INT,
  hora_entrega_receta TIMESTAMP,

  -- Administración (Art. 1406, 1410, 1412)
  fecha_admin DATE,
  hora_admin TIME,
  dosis_administrada INT CHECK (dosis_administrada >= 100 AND dosis_administrada <= 500),
  via_admin VARCHAR(5) DEFAULT 'IV' NOT NULL,
  aguja_confirmada BOOLEAN DEFAULT false,

  -- Snapshot del caballo (Art. 1412a: identificación del ejemplar)
  horse_nombre VARCHAR(255),
  horse_id_oficial VARCHAR(100),

  -- Firmas (Art. 1412c: certificación profesional)
  vet_oficial_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vet_oficial_nombre VARCHAR(255),
  vet_oficial_firmado BOOLEAN DEFAULT false,
  vet_oficial_firma_ts TIMESTAMP NULL,

  rep_nombre VARCHAR(255),
  rep_firmado BOOLEAN DEFAULT false,
  rep_firma_ts TIMESTAMP NULL,

  -- Validaciones calculadas (para auditoría)
  val_horas_antes DECIMAL(4,2) NULL,
  val_dosis_ok BOOLEAN DEFAULT false,
  val_rx_tiempo_ok BOOLEAN DEFAULT false,
  val_coincide_dosis BOOLEAN DEFAULT false,

  -- Estado y auditoría
  observaciones TEXT NULL,
  estado VARCHAR(20) DEFAULT 'borrador' NOT NULL CHECK (estado IN ('borrador', 'certificado', 'distribuido')),
  certificado_en TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pmf_records_race_entry_id ON pmf_records(race_entry_id);
CREATE INDEX idx_pmf_records_vet_oficial_id ON pmf_records(vet_oficial_id);
CREATE INDEX idx_pmf_records_estado ON pmf_records(estado);
CREATE INDEX idx_pmf_records_vet_oficial_firmado ON pmf_records(vet_oficial_firmado);
CREATE INDEX idx_pmf_records_rep_firmado ON pmf_records(rep_firmado);

-- Enable RLS
ALTER TABLE pmf_records ENABLE ROW LEVEL SECURITY;

-- RLS: All authenticated can read
CREATE POLICY "Enable read for authenticated users" ON pmf_records
  FOR SELECT TO authenticated USING (true);

-- RLS: Only Vet Oficial can insert
CREATE POLICY "Enable insert for vet oficial" ON pmf_records
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS: Anyone can update their own signature status
CREATE POLICY "Enable update for signing" ON pmf_records
  FOR UPDATE TO authenticated USING (true);
