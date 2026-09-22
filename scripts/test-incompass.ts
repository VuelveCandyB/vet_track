/**
 * Test script for InCompass API integration
 * Usage: npx tsx scripts/test-incompass.ts <microchip>
 *
 * Example: npx tsx scripts/test-incompass.ts "123456789"
 */

import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { searchIncompassHorse, parseDateFromIncompass, mapSexToGender, mapColorCode } from '../lib/incompass'

async function main() {
  const chip = process.argv[2]

  if (!chip) {
    console.error('❌ Usage: npx tsx scripts/test-incompass.ts <microchip>')
    console.error('Example: npx tsx scripts/test-incompass.ts "123456789"')
    process.exit(1)
  }

  console.log(`\n🔍 Buscando caballo con microchip: ${chip}`)
  console.log('─'.repeat(60))

  try {
    const result = await searchIncompassHorse(chip)

    if (!result.found) {
      console.log('❌ No encontrado en InCompass')
      process.exit(0)
    }

    const data = result.data!
    console.log('✅ Encontrado en InCompass\n')

    // Display raw data
    console.log('📋 Datos crudos recibidos:')
    console.log(JSON.stringify(data, null, 2))

    // Display parsed data
    console.log('\n📊 Datos parseados para horses table:')
    console.log('─'.repeat(60))

    const mappings = [
      { field: 'horseName', value: data.horseName, target: 'horses.name' },
      { field: 'registrationNumber', value: data.registrationNumber, target: 'horses.registration' },
      { field: 'microchipNumber', value: data.microchipNumber, target: 'horses.microchip' },
      {
        field: 'dob',
        value: data.dob,
        parsed: data.dob ? parseDateFromIncompass(data.dob) : null,
        target: 'horses.birth_date (MM/DD/YYYY → YYYY-MM-DD)'
      },
      { field: 'breed', value: data.breed, target: 'horses.raza' },
      {
        field: 'sex',
        value: data.sex,
        parsed: mapSexToGender(data.sex),
        target: 'horses.gender (code → H/M)'
      },
      { field: 'color', value: data.color, parsed: mapColorCode(data.color), target: 'horses.color' },
      { field: 'tattoo', value: data.tattoo, target: 'horses.tattoo (NEW)' },
      {
        field: 'dam',
        value: data.dam?.horseName,
        target: 'horses.madre'
      },
    ]

    for (const mapping of mappings) {
      const displayValue = mapping.parsed !== undefined ? mapping.parsed : mapping.value
      const status = displayValue ? '✓' : '○'
      console.log(`${status} ${mapping.target.padEnd(45)} = ${displayValue || '(null)'}`)
    }

    // Display markings
    if (data.markings && data.markings.length > 0) {
      console.log('\n📍 Marcas (horse_markings table):')
      console.log('─'.repeat(60))
      for (let i = 0; i < data.markings.length; i++) {
        const marking = data.markings[i]
        console.log(`[${i}] markPartId: ${marking.markPartId || '(null)'}, text1: ${marking.text1 || '(null)'}, text2: ${marking.text2 || '(null)'}`)
      }
    } else {
      console.log('\n📍 Marcas: ninguna')
    }

    console.log('\n' + '─'.repeat(60))
    console.log('✅ Test completado exitosamente')
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
