import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iutzdscrtwdguhamobpu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dHpkc2NydHdkZ3VoYW1vYnB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3OTM4NywiZXhwIjoyMDkyMzU1Mzg3fQ.O_h8a6eVxVpxrQW0Mt5mulmK1bvwNzLBElJTdTwB7zg';

const supabase = createClient(supabaseUrl, supabaseKey);

const { data: horses } = await supabase
  .from('horses')
  .select('id, name, status')
  .in('status', ['rest', 'injury']);

if (horses && horses.length > 0) {
  console.log(`Found ${horses.length} horses with status rest/injury:`);
  horses.forEach(h => {
    console.log(`  - "${h.name}" (${h.status})`);
  });
} else {
  console.log('✓ No hay caballos con status rest o injury');
}
