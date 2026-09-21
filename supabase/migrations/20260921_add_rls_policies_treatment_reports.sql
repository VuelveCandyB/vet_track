-- Add RLS policies to treatment_reports table
-- Allow authenticated users to read all treatment reports
CREATE POLICY "authenticated_select_treatment_reports" ON treatment_reports
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert their own treatment reports
CREATE POLICY "authenticated_insert_treatment_reports" ON treatment_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Allow authenticated users to update their own treatment reports
CREATE POLICY "authenticated_update_treatment_reports" ON treatment_reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR created_by IS NULL);

-- Allow authenticated users to delete their own treatment reports
CREATE POLICY "authenticated_delete_treatment_reports" ON treatment_reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR created_by IS NULL);
