import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const colors = ['Black', 'Bay', 'Chestnut', 'Grey', 'Roan'];
const genders = ['M', 'H'];
const statuses = ['active', 'rest', 'injury'];
const horseName = `TEST-${Math.random().toString(36).substring(7).toUpperCase()}`;
const microchip = `MC${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
const birthDate = new Date(2015 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

try {
  const { data, error } = await supabase
    .from('horses')
    .insert({
      name: horseName,
      color: colors[Math.floor(Math.random() * colors.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      microchip: microchip,
      gender: genders[Math.floor(Math.random() * genders.length)],
      birth_date: birthDate.toISOString().split('T')[0],
      owner: `Owner ${Math.floor(Math.random() * 100)}`,
      trainer: `Trainer ${Math.floor(Math.random() * 50)}`,
      registration: `REG${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    })
    .select('id, name, microchip, birth_date, color, gender, owner, trainer')
    .single();

  if (error) {
    console.error('Error creating horse:', error);
    process.exit(1);
  }

  console.log('✅ Horse created:');
  console.log(`   Name: ${data.name}`);
  console.log(`   Microchip: ${data.microchip}`);
  console.log(`   Birth Date: ${data.birth_date}`);
  console.log(`   Color: ${data.color}`);
  console.log(`   Gender: ${data.gender}`);
  console.log(`   Owner: ${data.owner}`);
  console.log(`   Trainer: ${data.trainer}`);
  console.log(`   ID: ${data.id}`);
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
