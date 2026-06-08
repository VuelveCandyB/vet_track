import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iutzdscrtwdguhamobpu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dHpkc2NydHdkZ3VoYW1vYnB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3OTM4NywiZXhwIjoyMDkyMzU1Mzg3fQ.O_h8a6eVxVpxrQW0Mt5mulmK1bvwNzLBElJTdTwB7zg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateHorse() {
  try {
    console.log('Buscando caballo "Segundo Caballo de Prueba"...');
    const { data: horses, error: searchError } = await supabase
      .from('horses')
      .select('id, name, status')
      .ilike('name', '%Segundo Caballo de Prueba%');

    if (searchError) {
      console.error('❌ Error en búsqueda:', searchError);
      process.exit(1);
    }

    if (!horses || horses.length === 0) {
      console.log('❌ No se encontró el caballo');
      process.exit(1);
    }

    const horse = horses[0];
    console.log(`✓ Caballo encontrado: "${horse.name}" (ID: ${horse.id})`);
    console.log(`  Status actual: ${horse.status}`);

    console.log('\nActualizando status a "deceased"...');
    const { error: updateError } = await supabase
      .from('horses')
      .update({ status: 'deceased' })
      .eq('id', horse.id);

    if (updateError) {
      console.error('❌ Error en actualización:', updateError);
      process.exit(1);
    }

    console.log('✅ Status actualizado a "deceased"');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

updateHorse();
