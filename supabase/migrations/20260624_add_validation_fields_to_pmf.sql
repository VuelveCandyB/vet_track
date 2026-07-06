-- Add validation audit fields to pmf_records
ALTER TABLE pmf_records
ADD COLUMN IF NOT EXISTS val_horas_antes DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS val_dosis_ok BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS val_rx_tiempo_ok BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS val_coincide_dosis BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS val_aguja_confirmada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS val_en_loes BOOLEAN DEFAULT false;
