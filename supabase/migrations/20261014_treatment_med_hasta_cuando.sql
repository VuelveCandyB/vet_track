-- Tratamientos de dosificación diaria: fecha de la última dosis por medicamento.
-- La columna ya existe en producción (creada fuera de las migraciones); esta
-- migración la deja registrada en git y es idempotente.
ALTER TABLE treatment_report_medications
ADD COLUMN IF NOT EXISTS hasta_cuando date;
