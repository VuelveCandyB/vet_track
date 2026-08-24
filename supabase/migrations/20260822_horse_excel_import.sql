-- Reemplaza el sync por scraping de CRIO con importación de Excel:
-- agrega ID estable de CRIO + campos de pedigrí/clasificación + flag no destructivo de "no encontrado"

ALTER TABLE horses
  ADD COLUMN crio_id INTEGER NULL,
  ADD COLUMN padre TEXT NULL,
  ADD COLUMN madre TEXT NULL,
  ADD COLUMN raza TEXT NULL,
  ADD COLUMN categoria TEXT NULL,
  ADD COLUMN excel_imported_at TIMESTAMPTZ NULL,
  ADD COLUMN crio_not_found_since TIMESTAMPTZ NULL;

-- crio_id es el identificador más estable que expone CRIO (a diferencia de detail_url_id,
-- que el scraper nunca pudo poblar). Único pero nullable — caballos legacy/manuales no lo tendrán.
CREATE UNIQUE INDEX idx_horses_crio_id ON horses (crio_id) WHERE crio_id IS NOT NULL;
