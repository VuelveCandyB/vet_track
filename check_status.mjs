import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iutzdscrtwdguhamobpu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dHpkc2NydHdkZ3VoYW1vYnB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3OTM4NywiZXhwIjoyMDkyMzU1Mzg3fQ.O_h8a6eVxVpxrQW0Mt5mulmK1bvwNzLBElJTdTwB7zg';

const supabase = createClient(supabaseUrl, supabaseKey);

try {
  const { data: horses } = await supabase
    .from('horses')
    .select('status')
    .limit(100);

  if (horses) {
    const statuses = [...new Set(horses.map(h => h.status))];
    console.log('Valores de status existentes en DB:');
    statuses.forEach(s => console.log(`  - "${s}"`));
  }
} catch (err) {
  console.error('Error:', err);
}
