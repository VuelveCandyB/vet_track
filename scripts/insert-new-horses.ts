import * as XLSX from 'xlsx'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const euFile = 'C:\\Users\\cabal\\Downloads\\CaballosDelGrupoCABALLOSACTIVOS (2).xls'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function main() {
  console.log('📖 Leyendo archivo de CRIO...')

  const workbook = XLSX.readFile(euFile)
  let sheetName = 'CABALLOS ACTIVOS'
  if (!workbook.Sheets[sheetName]) {
    sheetName = workbook.SheetNames[0]
  }

  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false }) as Record<string, any>[]

  console.log(`✓ Archivo leído: ${data.length} registros\n`)

  // Conectar a Supabase
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Obtener caballos existentes
  const { data: existingHorses } = await supabase
    .from('horses')
    .select('id, name')

  if (!existingHorses) {
    console.error('No existing horses found')
    process.exit(1)
  }

  const existingNames = new Set(existingHorses.map(h => h.name.toUpperCase()))

  // También obtener microchips existentes
  const { data: existingMicrochips } = await supabase
    .from('horses')
    .select('microchip')

  const microchipSet = new Set((existingMicrochips || [])
    .map(h => h.microchip)
    .filter((m): m is string => m !== null))

  console.log(`🔍 Encontrados ${existingHorses.length} caballos existentes`)
  console.log(`📝 Encontrados ${microchipSet.size} microchips únicos`)
  console.log(`📝 Buscando nuevos...\n`)

  // Procesar filas del Excel
  const newHorses: any[] = []

  data.forEach((row, idx) => {
    const name = (row['Nombre'] || '').toString().trim()
    if (!name || existingNames.has(name.toUpperCase())) {
      return // Ya existe por nombre
    }

    // Parse microchip PRIMERO
    let microchip: string | null = null
    if (row['Microchip']) {
      const mc = String(row['Microchip']).trim().replace(/^\*/, '')
      if (mc) {
        microchip = mc
      }
    }

    // Si tiene microchip duplicado, saltar
    if (microchip && microchipSet.has(microchip)) {
      return
    }

    // Parse crio_id
    let crio_id: number | null = null
    if (row['ID Caballo']) {
      const parsed = parseInt(String(row['ID Caballo']).trim(), 10)
      if (!isNaN(parsed)) {
        crio_id = parsed
      }
    }

    // Parse gender
    let gender: string | null = null
    if (row['Sexo']) {
      const s = String(row['Sexo']).trim().toUpperCase()
      if (s === 'H' || s === 'M') {
        gender = s
      }
    }

    // Parse birth_date
    let birth_date: string | null = null
    if (row['Fecha de Nacimiento']) {
      try {
        const val = row['Fecha de Nacimiento']
        if (typeof val === 'number') {
          const parsed = XLSX.SSF.parse_date_code(val)
          if (parsed) {
            const y = parsed.y
            const m = String(parsed.m).padStart(2, '0')
            const d = String(parsed.d).padStart(2, '0')
            birth_date = `${y}-${m}-${d}`
          }
        } else if (typeof val === 'string' && val.trim()) {
          const d = new Date(val.trim())
          if (!isNaN(d.getTime())) {
            birth_date = d.toISOString().split('T')[0]
          }
        }
      } catch (e) {
        // Skip
      }
    }

    // microchip ya fue parseado arriba

    const padre = row['Padre'] ? String(row['Padre']).trim() : null
    const madre = row['Madre'] ? String(row['Madre']).trim() : null
    const raza = row['Raza'] ? String(row['Raza']).trim() : null
    const categoria = row['Categoría'] ? String(row['Categoría']).trim() : null
    const owner = row['Propietarios'] ? String(row['Propietarios']).trim() : null
    const color = row['Pelo'] ? String(row['Pelo']).trim() : null
    let ubicacion: string | null = null
    if (row['Full Location']) {
      ubicacion = String(row['Full Location']).trim()
    } else if (row['Ubicación']) {
      ubicacion = String(row['Ubicación']).trim()
    }

    newHorses.push({
      name,
      crio_id,
      gender,
      birth_date,
      microchip,
      padre,
      madre,
      raza,
      categoria,
      owner,
      color,
      ubicacion,
      status: 'active',
      excel_imported_at: new Date().toISOString(),
    })
  })

  console.log(`✅ ${newHorses.length} nuevos caballos encontrados\n`)

  if (newHorses.length === 0) {
    console.log('No new horses to insert')
    return
  }

  // Insertar en batches de 500
  const batchSize = 500
  let inserted = 0

  for (let i = 0; i < newHorses.length; i += batchSize) {
    const batch = newHorses.slice(i, i + batchSize)
    console.log(`📤 Insertando batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newHorses.length / batchSize)} (${batch.length} caballos)...`)

    const { error } = await supabase
      .from('horses')
      .insert(batch)

    if (error) {
      console.error(`❌ Error en batch: ${error.message}`)
      process.exit(1)
    }

    inserted += batch.length
  }

  console.log(`\n✅ ${inserted} nuevos caballos insertados exitosamente`)
  console.log('\n📊 Total esperado en BD: 864 (existentes) + 499 (nuevos) = 1,363')
}

main()
