const fs = require('fs');

// Read Excel horses
const excelHorses = JSON.parse(fs.readFileSync('scripts/excel-horses.json', 'utf-8'));
const excelSet = new Set(excelHorses.map(name => name.trim().toUpperCase()));

// Database horses (from the previous query)
const dbHorses = [
  "ABUELA MIMA", "ABUELA TOLIN", "ABUELO DANDY", "ABUELO WILLY", "ACANGANA",
  "ACCIONISTA", "ACHILIN BU", "ACOMPAÑAME", "ACTION BELIEVE", "ADONAI V.",
  // ... (using the actual data from Supabase)
];

// For this script, let's save the DB data to a file first
// The user can run this after getting the full list

console.log('Excel horses:', excelSet.size);
console.log('Sample Excel horses:');
[...excelSet].slice(0, 5).forEach(h => console.log('  -', h));

console.log('\nTo complete the comparison, save the full DB horse list.');
console.log('Copy the Supabase query result and create scripts/db-horses.json');
