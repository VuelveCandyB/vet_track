-- Add hora_fin_tratamiento column to treatment_reports table
ALTER TABLE treatment_reports
ADD COLUMN hora_fin_tratamiento text;
