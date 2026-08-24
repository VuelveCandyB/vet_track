const XLSX = require('xlsx');
const fs = require('fs');

const xlsPath = 'C:\\Users\\cabal\\Downloads\\CaballosDelGrupoCABALLOSACTIVOS (2).xls';

const workbook = XLSX.readFile(xlsPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// Extract unique horse names
const names = data.map(row => (row.Nombre || row.nombre || '').trim()).filter(Boolean);
const uniqueNames = [...new Set(names)].sort();

console.log('Total records in Excel:', data.length);
console.log('Unique horse names:', uniqueNames.length);

// Save to JSON for comparison
fs.writeFileSync('scripts/excel-horses.json', JSON.stringify(uniqueNames, null, 2));

console.log('\nSaved to scripts/excel-horses.json');
console.log('\nFirst 30 horses from Excel:');
uniqueNames.slice(0, 30).forEach((name, i) => {
  console.log(`  ${i+1}. ${name}`);
});

if (uniqueNames.length > 30) {
  console.log(`\n  ... and ${uniqueNames.length - 30} more`);
}
