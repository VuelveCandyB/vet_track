import * as XLSX from 'xlsx'
import * as fs from 'fs'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Cargar .env.local
config({ path: '.env.local' })

const euFile = 'C:\\Users\\cabal\\OneDrive - Camarero Race Track Corporation\\Eu - data.xlsx'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function main() {
  console.log('📋 Leyendo archivo de eutanasia...')

  if (!fs.existsSync(euFile)) {
    console.error(`❌ Archivo no encontrado: ${euFile}`)
    process.exit(1)
  }

  const workbook = XLSX.readFile(euFile)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false }) as Record<string, any>[]

  console.log(`✓ Archivo leído: ${data.length} registros`)

  // Extraer nombres de eutanasia (columna J = índice 9 = "J")
  // En sheet_to_json, el nombre de columna se infiere del header
  // Necesitamos inspeccionar qué columna tiene los nombres

  const allKeys = Object.keys(data[0] || {})
  console.log(`Columnas encontradas: ${allKeys.join(', ')}`)

  // Buscar la columna que contiene "CABALLO" o "Nombre"
  let nameColumn = allKeys.find(k => k.toLowerCase().includes('caballo') || k.toLowerCase().includes('nombre')) || allKeys[9]
  console.log(`Usando columna "${nameColumn}" como nombres de caballos`)

  const euNames = data
    .map(row => row[nameColumn])
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    .map(name => name.trim().toUpperCase())

  console.log(`\n✓ Extraídos ${euNames.length} nombres de eutanasia`)
  console.log(`Primeros 10: ${euNames.slice(0, 10).join(', ')}`)

  // Conectar a Supabase
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configurados')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log(`\n🔍 Buscando matches en la BD...`)

  // Estrategia 1: Match exacto
  console.log('\n  Estrategia 1: Búsqueda exacta...')
  const { data: exactMatches, error: e1 } = await supabase
    .from('horses')
    .select('id, name, status')
    .in('name', euNames)

  if (e1) {
    console.error('❌ Error en búsqueda exacta:', e1.message)
  } else {
    console.log(`    ✓ ${exactMatches?.length || 0} matches exactos`)
    exactMatches?.slice(0, 5).forEach(h => console.log(`      • ${h.name} (${h.id})`))
  }

  // Estrategia 2: Match por palabras clave (primera palabra)
  console.log('\n  Estrategia 2: Búsqueda por primera palabra...')
  const firstWords = [...new Set(euNames.map(name => name.split(' ')[0]))]
  console.log(`    Palabras únicas: ${firstWords.length}`)

  let keywordMatches: any[] = []
  for (const word of firstWords) {
    const { data: matches } = await supabase
      .from('horses')
      .select('id, name, status')
      .ilike('name', `${word}%`)

    if (matches) {
      keywordMatches = [...keywordMatches, ...matches]
    }
  }

  const uniqueKeywordMatches = Array.from(new Map(keywordMatches.map(h => [h.id, h])).values())
  console.log(`    ✓ ${uniqueKeywordMatches.length} matches por palabra clave`)
  uniqueKeywordMatches.slice(0, 5).forEach(h => console.log(`      • ${h.name}`))

  // Estrategia 3: Match fuzzy (contains any word from EU name in horse name, case-insensitive)
  console.log('\n  Estrategia 3: Búsqueda fuzzy (palabras clave dentro del nombre)...')
  const { data: allHorses } = await supabase
    .from('horses')
    .select('id, name, status')

  const fuzzyMatches: any[] = []

  if (allHorses) {
    for (const euName of euNames) {
      const euWords = euName.split(' ').filter(w => w.length > 2) // palabras > 2 caracteres

      for (const horse of allHorses) {
        const horseName = horse.name.toUpperCase()

        // Match si hay ANY palabra en común
        if (euWords.some(word => horseName.includes(word))) {
          fuzzyMatches.push({
            eu_name: euName,
            horse_id: horse.id,
            horse_name: horse.name,
            match_words: euWords.filter(w => horseName.includes(w))
          })
          break // Solo registrar una vez por EU name
        }
      }
    }
  }

  console.log(`    ✓ ${fuzzyMatches.length} matches fuzzy`)
  fuzzyMatches.slice(0, 10).forEach(m => console.log(`      • EU: "${m.eu_name}" → BD: "${m.horse_name}" (${m.match_words.join(',')})`))

  // Resumen
  console.log(`\n📊 RESUMEN DE DRY-RUN:`)
  console.log(`  • Registros de eutanasia: ${euNames.length}`)
  console.log(`  • Exactos: ${exactMatches?.length || 0}`)
  console.log(`  • Palabra clave: ${uniqueKeywordMatches.length}`)
  console.log(`  • Fuzzy: ${fuzzyMatches.length}`)
  console.log(`  • Sin match encontrado: ${euNames.length - (fuzzyMatches.length || 0)}`)

  console.log(`\n✅ DRY-RUN COMPLETADO - SIN CAMBIOS EN LA BD`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
