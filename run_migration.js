const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    const migrationSql = fs.readFileSync(
      'supabase/migrations/20260708_add_ubicacion_to_horses.sql',
      'utf-8'
    );

    console.log('Executing migration...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });

    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }

    console.log('✓ Migration executed successfully');
  } catch (err) {
    console.error('Error running migration:', err);
    process.exit(1);
  }
}

runMigration();
