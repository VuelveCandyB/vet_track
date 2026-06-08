import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iutzdscrtwdguhamobpu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dHpkc2NydHdkZ3VoYW1vYnB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3OTM4NywiZXhwIjoyMDkyMzU1Mzg3fQ.O_h8a6eVxVpxrQW0Mt5mulmK1bvwNzLBElJTdTwB7zg';

const supabase = createClient(supabaseUrl, supabaseKey);

try {
  console.log('Creando caballo "CABALLO PRUEBA 3"...');
  
  const { data, error } = await supabase
    .from('horses')
    .insert([{
      name: 'CABALLO PRUEBA 3',
      color: 'Bay',
      gender: 'M',
      birth_date: '2020-01-15',
      registration: 'TEST-003',
      microchip: 'HC Test 3',
      status: 'active'
    }])
    .select();

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  if (data && data.length > 0) {
    const horse = data[0];
    console.log('✅ Caballo creado exitosamente');
    console.log(`   ID: ${horse.id}`);
    console.log(`   Nombre: ${horse.name}`);
    console.log(`   Status: ${horse.status}`);
    console.log(`   Color: ${horse.color}`);
    console.log(`   Fecha de nacimiento: ${horse.birth_date}`);
  }
} catch (err) {
  console.error('❌ Error:', err);
  process.exit(1);
}
