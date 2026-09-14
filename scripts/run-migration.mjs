import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

try {
  // Read the migration file
  const migrationPath = path.join('.', 'supabase', 'migrations', '20260902_horse_alternate_microchips.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Execute the migration
  const { error } = await supabase.rpc('exec', { sql_query: sql }).catch(() => {
    // If rpc doesn't work, try direct query execution
    return supabase.query(sql);
  });

  if (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }

  console.log('✅ Migration executed successfully!');
} catch (err) {
  console.error('Error:', err.message);
  // Try alternative method - read and execute statement by statement
  try {
    const migrationPath = path.join('.', 'supabase', 'migrations', '20260902_horse_alternate_microchips.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 60) + '...');
      // We can't really execute raw SQL via the standard client
      // This would need to be done via the Supabase SQL Editor or local supabase CLI
    }

    console.log('\n⚠️  Please execute the migration manually:');
    console.log('Option 1: Use Supabase Dashboard > SQL Editor');
    console.log('Option 2: Use local supabase CLI: supabase db push');
    console.log('\nMigration file location:', migrationPath);
  } catch (err2) {
    console.error('Alternative method failed:', err2.message);
  }
}
