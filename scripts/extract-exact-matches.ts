import * as XLSX from 'xlsx'
import * as fs from 'fs'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const euFile = 'C:\\Users\\cabal\\OneDrive - Camarero Race Track Corporation\\Eu - data.xlsx'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function main() {
  // Leer Excel
  const workbook = XLSX.readFile(euFile)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false }) as Record<string, any>[]

  const euNames = data
    .map(row => (row['CABALLO Nombre'] || '').toString().trim().toUpperCase())
    .filter(name => name.length > 0)

  // Conectar a Supabase y obtener todos los caballos
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: allHorses } = await supabase
    .from('horses')
    .select('id, name')

  if (!allHorses) {
    console.error('No horses found')
    process.exit(1)
  }

  // Hacer matching case-insensitive
  const euNameSet = new Set(euNames)
  const exactMatches = allHorses.filter(h =>
    euNameSet.has(h.name.toUpperCase())
  )

  console.log(`Found ${exactMatches.length} exact matches\n`)
  console.log('Horse IDs and names:')
  console.log(exactMatches.map(h => `'${h.id}',`).join('\n'))
  console.log('\n\nHorse names:')
  console.log(exactMatches.map(h => `'${h.name}',`).join('\n'))
}

main()
