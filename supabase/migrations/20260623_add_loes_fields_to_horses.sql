-- Add LOES (Sangrador) fields to horses table
-- Art. 1001-1003: Lista Oficial de Ejemplares Sangradores

ALTER TABLE horses
ADD COLUMN en_loes BOOLEAN DEFAULT false,
ADD COLUMN pmf_activo BOOLEAN DEFAULT false,
ADD COLUMN fecha_ingreso_loes DATE NULL,
ADD COLUMN tipo_hemorragia VARCHAR(50) NULL CHECK (tipo_hemorragia IN ('epistaxis_unilateral', 'epistaxis_bilateral', 'traqueal'));

-- Create index for LOES lookups
CREATE INDEX idx_horses_en_loes ON horses(en_loes);
CREATE INDEX idx_horses_pmf_activo ON horses(pmf_activo);
