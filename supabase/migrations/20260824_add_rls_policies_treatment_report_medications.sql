-- RLS Policies for treatment_report_medications table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own treatment report medications" ON treatment_report_medications;
DROP POLICY IF EXISTS "Users can insert medications for their treatment reports" ON treatment_report_medications;
DROP POLICY IF EXISTS "Users can update medications in their treatment reports" ON treatment_report_medications;
DROP POLICY IF EXISTS "Users can delete medications from their treatment reports" ON treatment_report_medications;

-- Policy for SELECT
CREATE POLICY "Users can view their own treatment report medications"
ON treatment_report_medications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM treatment_reports
    WHERE treatment_reports.id = treatment_report_medications.treatment_report_id
    AND treatment_reports.created_by = auth.uid()
  )
);

-- Policy for INSERT
CREATE POLICY "Users can insert medications for their treatment reports"
ON treatment_report_medications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM treatment_reports
    WHERE treatment_reports.id = treatment_report_medications.treatment_report_id
    AND treatment_reports.created_by = auth.uid()
  )
);

-- Policy for UPDATE
CREATE POLICY "Users can update medications in their treatment reports"
ON treatment_report_medications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM treatment_reports
    WHERE treatment_reports.id = treatment_report_medications.treatment_report_id
    AND treatment_reports.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM treatment_reports
    WHERE treatment_reports.id = treatment_report_medications.treatment_report_id
    AND treatment_reports.created_by = auth.uid()
  )
);

-- Policy for DELETE
CREATE POLICY "Users can delete medications from their treatment reports"
ON treatment_report_medications
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM treatment_reports
    WHERE treatment_reports.id = treatment_report_medications.treatment_report_id
    AND treatment_reports.created_by = auth.uid()
  )
);
