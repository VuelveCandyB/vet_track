-- Migración: Agregar campos para Art. 811d (Duración y Replicación Diaria)
-- Fecha: 2026-02-23
-- Descripción: Agregar soporte para "hasta_cuando" y replicación automática de informes

ALTER TABLE treatment_reports
ADD COLUMN IF NOT EXISTS hasta_cuando DATE NULL COMMENT 'Hasta cuándo durará el medicamento (Art. 811d)',
ADD COLUMN IF NOT EXISTS es_auto_generado BOOLEAN DEFAULT FALSE COMMENT 'Si fue generado automáticamente por el sistema',
ADD COLUMN IF NOT EXISTS informe_padre_id UUID NULL COMMENT 'ID del informe original si es auto-generado';

-- Crear índice para búsquedas de informes que necesitan replicación
CREATE INDEX IF NOT EXISTS idx_treatment_reports_hasta_cuando
ON treatment_reports(hasta_cuando)
WHERE estado = 'borrador' AND hasta_cuando IS NOT NULL;

-- Crear índice para búsquedas de informes auto-generados
CREATE INDEX IF NOT EXISTS idx_treatment_reports_auto_generated
ON treatment_reports(es_auto_generado, fecha_tratamiento);

-- Agregar constraint para validar que hasta_cuando >= fecha_tratamiento
ALTER TABLE treatment_reports
ADD CONSTRAINT check_hasta_cuando_valid
CHECK (hasta_cuando IS NULL OR hasta_cuando >= fecha_tratamiento::date);

-- Tabla auxiliar para rastrear último día procesado (para evitar duplicados)
CREATE TABLE IF NOT EXISTS treatment_reports_replication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  informe_padre_id UUID NOT NULL REFERENCES treatment_reports(id) ON DELETE CASCADE,
  ultima_fecha_procesada DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(informe_padre_id)
);

CREATE INDEX IF NOT EXISTS idx_replication_log_padre
ON treatment_reports_replication_log(informe_padre_id);
