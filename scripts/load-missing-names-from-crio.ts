/**
 * Load missing horse names from CRIO Excel file
 * Reads the CRIO Excel and updates horses that have empty names
 */

import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import * as fs from 'fs'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  console.log('\n📊 CARGANDO NOMBRES DESDE EXCEL DE CRIO\n')

  // Read Excel file
  const excelPath = 'C:\\Users\\cabal\\Downloads\\CaballosDelGrupoCABALLOSACTIVOS (5).xls'

  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Archivo no encontrado: ${excelPath}`)
    process.exit(1)
  }

  console.log(`📁 Leyendo: ${excelPath}\n`)

  const workbook = XLSX.readFile(excelPath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(sheet)

  console.log(`📋 Filas en Excel: ${data.length}\n`)

  // Get nameless horses from DB
  const { data: namelessHorses } = await supabase
    .from('horses')
    .select('id, microchip')
    .eq('status', 'active')
    .or('name.is.null,name.eq.""')

  console.log(`🐴 Caballos sin nombre en BD: ${namelessHorses?.length || 0}\n`)

  if (!namelessHorses || namelessHorses.length === 0) {
    console.log('✅ No hay caballos sin nombre\n')
    return
  }

  // Create microchip → Excel row map
  const excelMap = new Map<string, any>()

  for (const row of data) {
    // Try different column names for microchip
    const microchip = row['Microchip'] || row['microchip'] || row['MICROCHIP'] || row['Chip']
    const name = row['Nombre'] || row['nombre'] || row['NOMBRE'] || row['Name']

    if (microchip && name) {
      excelMap.set(String(microchip).trim(), { name: String(name).trim(), row })
    }
  }

  console.log(`📊 Microchips encontrados en Excel: ${excelMap.size}\n`)

  // Update missing names
  let updated = 0
  let notFound = 0

  console.log('🔄 Actualizando nombres...\n')

  for (const horse of namelessHorses) {
    const excelData = excelMap.get(String(horse.microchip).trim())

    if (excelData) {
      const { error } = await supabase
        .from('horses')
        .update({ name: excelData.name })
        .eq('id', horse.id)

      if (!error) {
        console.log(`✓ ${horse.microchip} → "${excelData.name}"`)
        updated++
      } else {
        console.log(`✗ ${horse.microchip} - Error: ${error.message}`)
      }
    } else {
      console.log(`○ ${horse.microchip} - No encontrado en Excel`)
      notFound++
    }
  }

  console.log('\n' + '═'.repeat(80))
  console.log('\n📊 RESUMEN:')
  console.log(`  Actualizados: ${updated}`)
  console.log(`  No encontrados en Excel: ${notFound}`)
  console.log(`  Total procesados: ${updated + notFound}\n`)
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
