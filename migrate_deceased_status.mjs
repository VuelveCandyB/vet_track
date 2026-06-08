import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iutzdscrtwdguhamobpu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dHpkc2NydHdkZ3VoYW1vYnB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3OTM4NywiZXhwIjoyMDkyMzU1Mzg3fQ.O_h8a6eVxVpxrQW0Mt5mulmK1bvwNzLBElJTdTwB7zg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Ejecutar SQL directamente
const { data, error } = await supabase.rpc('exec_sql_migration', {
  sql: `
    ALTER TABLE horses 
    DROP CONSTRAINT horses_status_check;
    
    ALTER TABLE horses 
    ADD CONSTRAINT horses_status_check 
    CHECK (status IN ('active', 'rest', 'injury', 'deceased'));
  `
});

if (error) {
  console.error('Error al ejecutar migración:', error);
} else {
  console.log('✅ Constraint actualizado exitosamente');
}
