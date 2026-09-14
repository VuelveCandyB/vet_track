import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

try {
  const { data, error } = await supabase
    .from('horses')
    .insert({
      name: 'TEST',
      color: 'Black',
      status: 'active',
      microchip: 'TESTCHIP001',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating horse:', error);
    process.exit(1);
  }

  console.log('✅ Horse created with ID:', data.id);
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
