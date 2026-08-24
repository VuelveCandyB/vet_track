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

  // Conectar a Supabase
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Obtener todos los caballos
  const { data: allHorses } = await supabase
    .from('horses')
    .select('id, name')

  if (!allHorses) {
    console.error('No horses found')
    process.exit(1)
  }

  // Hacer matching case-insensitive y recopilar info de eutanasia
  const euMap = new Map()

  data.forEach(row => {
    const name = (row['CABALLO Nombre'] || '').toString().trim().toUpperCase()
    if (name.length === 0) return

    let death_date: string | null = null
    const deathDateVal = row['Death Date']
    if (deathDateVal) {
      if (typeof deathDateVal === 'number') {
        const parsed = XLSX.SSF.parse_date_code(deathDateVal)
        if (parsed) {
          const y = parsed.y
          const m = String(parsed.m).padStart(2, '0')
          const d = String(parsed.d).padStart(2, '0')
          death_date = `${y}-${m}-${d}`
        }
      } else if (typeof deathDateVal === 'string') {
        death_date = deathDateVal.trim()
      }
    }

    const reason = (row['RAZON '] || '').toString().trim()
    euMap.set(name, { death_date, reason })
  })

  console.log(`📋 Datos de eutanasia extraídos: ${euMap.size} registros\n`)

  // Buscar los 28 caballos que matchearon y crear registros de eutanasia
  const matchedHorses = allHorses.filter(h => euMap.has(h.name.toUpperCase()))

  console.log(`🔍 Encontrados ${matchedHorses.length} caballos con datos de eutanasia\n`)

  const euthanasiaRecords = matchedHorses
    .map(horse => {
      const eu = euMap.get(horse.name.toUpperCase())
      if (!eu || !eu.death_date) {
        console.log(`⚠️  ${horse.name}: sin fecha de eutanasia`)
        return null
      }

      return {
        horse_id: horse.id,
        fecha: eu.death_date,
        motivo: eu.reason || 'Eutanasia registrada',
        vet_name: 'Sistema (Importación CRIO)',
        propietario_notificado: false,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  console.log(`\n✅ Creando ${euthanasiaRecords.length} registros de eutanasia...\n`)

  if (euthanasiaRecords.length === 0) {
    console.log('⚠️  No hay registros para crear')
    return
  }

  // Insertar en Supabase
  const { data: inserted, error } = await supabase
    .from('euthanasia')
    .insert(euthanasiaRecords)
    .select()

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  console.log(`✅ ${euthanasiaRecords.length} registros de eutanasia creados exitosamente`)

  // Mostrar resumen
  console.log('\n📊 Resumen:')
  euthanasiaRecords.slice(0, 5).forEach(r => {
    const horse = matchedHorses.find(h => h.id === r.horse_id)
    console.log(`  • ${horse?.name}: ${r.fecha} - ${r.motivo}`)
  })
  if (euthanasiaRecords.length > 5) {
    console.log(`  ... y ${euthanasiaRecords.length - 5} más`)
  }
}

main()
