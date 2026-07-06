-- Add DELETE policy to race_entries table
CREATE POLICY "Enable delete for authenticated users" ON race_entries
  FOR DELETE TO authenticated USING (true);
