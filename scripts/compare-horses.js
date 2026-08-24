const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const xlsPath = 'C:\\Users\\cabal\\Downloads\\CaballosDelGrupoCABALLOSACTIVOS (2).xls';

  // Read Excel file
  const workbook = XLSX.readFile(xlsPath);
  const sheetNames = workbook.SheetNames;
  console.log('Sheet names:', sheetNames);

  // Get first sheet
  const sheet = workbook.Sheets[sheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`\n✓ Read ${data.length} rows from Excel file\n`);
  console.log('First few records:');
  data.slice(0, 3).forEach((row, i) => {
    console.log(`${i + 1}:`, row);
  });

  // Get column names to understand structure
  if (data.length > 0) {
    console.log('\nColumns found:', Object.keys(data[0]));
  }

  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iutzdscrtwdguhamobpu.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey) {
    console.error('\n❌ SUPABASE_SERVICE_ROLE_KEY not set');
    console.log('Set it with: $env:SUPABASE_SERVICE_ROLE_KEY="your-key"');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get horses from DB
  const { data: dbHorses, error } = await supabase
    .from('horses')
    .select('id, name, created_at')
    .order('name');

  if (error) {
    console.error('\n❌ Error querying database:', error);
    process.exit(1);
  }

  console.log(`\n✓ Database has ${dbHorses.length} horses\n`);

  // Compare
  const excelNames = new Set(data.map(row => {
    // Try common column names
    const name = row['Caballo'] || row['CABALLO'] || row['Nombre'] || row['nombre'] || row['Horse'] || row['horse'];
    return name ? name.trim().toUpperCase() : null;
  }).filter(Boolean));

  const dbNames = new Set(dbHorses.map(h => h.name.trim().toUpperCase()));

  console.log('=== COMPARISON RESULTS ===\n');

  // Horses in Excel but NOT in DB
  const missingInDb = [];
  data.forEach(row => {
    const name = row['Caballo'] || row['CABALLO'] || row['Nombre'] || row['nombre'] || row['Horse'] || row['horse'];
    if (name && !dbNames.has(name.trim().toUpperCase())) {
      missingInDb.push(name.trim());
    }
  });

  if (missingInDb.length > 0) {
    console.log(`⚠️  ${missingInDb.length} horses in Excel but NOT in database:`);
    missingInDb.slice(0, 20).forEach(name => console.log(`   - ${name}`));
    if (missingInDb.length > 20) {
      console.log(`   ... and ${missingInDb.length - 20} more`);
    }
  } else {
    console.log('✓ All horses from Excel exist in database');
  }

  // Horses in DB but NOT in Excel
  const extraInDb = [];
  dbHorses.forEach(horse => {
    if (!excelNames.has(horse.name.trim().toUpperCase())) {
      extraInDb.push(horse.name);
    }
  });

  if (extraInDb.length > 0) {
    console.log(`\n⚠️  ${extraInDb.length} horses in database but NOT in Excel:`);
    extraInDb.slice(0, 20).forEach(name => console.log(`   - ${name}`));
    if (extraInDb.length > 20) {
      console.log(`   ... and ${extraInDb.length - 20} more`);
    }
  } else {
    console.log('\n✓ No extra horses in database');
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Excel records: ${data.length}`);
  console.log(`DB horses: ${dbHorses.length}`);
  console.log(`Missing in DB: ${missingInDb.length}`);
  console.log(`Extra in DB: ${extraInDb.length}`);
}

main().catch(console.error);
