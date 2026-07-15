-- Create LOES certificates table (Art. 1002)
CREATE TABLE loes_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Horse reference
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,

  -- Hemorrhage detection (by Vet Privado)
  fecha_deteccion DATE NOT NULL,
  tipo_hemorragia VARCHAR NOT NULL CHECK (tipo_hemorragia IN ('epistaxis_uni', 'epistaxis_bi', 'traqueal')),
  descripcion TEXT,
  detectado_por_vet_id UUID REFERENCES auth.users(id),
  detectado_por_vet_nombre VARCHAR,

  -- Certification (by Vet Oficial)
  fecha_certificacion DATE,
  certificado_por_vet_id UUID REFERENCES auth.users(id),
  certificado_por_vet_nombre VARCHAR,

  -- Furosemide prescription
  dosis_recetada INTEGER CHECK (dosis_recetada >= 100 AND dosis_recetada <= 500),

  -- Signatures
  vet_oficial_firma_timestamp TIMESTAMP,
  vet_privado_firma_timestamp TIMESTAMP,

  -- Digital signatures (base64 encoded images)
  vet_oficial_firma_digital BYTEA,
  vet_privado_firma_digital BYTEA,

  -- Document
  pdf_url VARCHAR,

  -- Status
  estado VARCHAR NOT NULL DEFAULT 'draft' CHECK (estado IN ('draft', 'signed', 'official', 'distributed')),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_loes_certificates_horse_id ON loes_certificates(horse_id);
CREATE INDEX idx_loes_certificates_estado ON loes_certificates(estado);

-- Update horses table with LOES fields
ALTER TABLE horses ADD COLUMN IF NOT EXISTS en_loes BOOLEAN DEFAULT FALSE;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS loes_certificado_en TIMESTAMP;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS loes_vet_oficial_id UUID;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS loes_vet_privado_id UUID;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS loes_furosemide_dosis INTEGER;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS loes_episodios_hemorragia INTEGER DEFAULT 0;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS loes_suspension_hasta DATE;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS loes_certificado_url VARCHAR;

-- Create indexes for LOES queries
CREATE INDEX IF NOT EXISTS idx_horses_en_loes ON horses(en_loes);
CREATE INDEX IF NOT EXISTS idx_horses_loes_suspension_hasta ON horses(loes_suspension_hasta);

-- Enable Row Level Security
ALTER TABLE loes_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Vets (both official and private) can view their own certificates
CREATE POLICY "Vets can view their certificates"
  ON loes_certificates FOR SELECT
  USING (
    detectado_por_vet_id = auth.uid() OR
    certificado_por_vet_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Vets can insert new hemorrhage reports
CREATE POLICY "Vets can create hemorrhage reports"
  ON loes_certificates FOR INSERT
  WITH CHECK (detectado_por_vet_id = auth.uid());

-- Vets can update their own reports
CREATE POLICY "Vets can update their reports"
  ON loes_certificates FOR UPDATE
  USING (
    detectado_por_vet_id = auth.uid() OR
    certificado_por_vet_id = auth.uid()
  );
