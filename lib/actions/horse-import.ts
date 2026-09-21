'use server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requireUser, isAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface ParsedHorseRow {
  rowIndex: number
  crio_id: number | null
  name: string | null
  gender: string | null
  birth_date: string | null
  microchip: string | null
  padre: string | null
  madre: string | null
  raza: string | null
  categoria: string | null
  owner: string | null
  color: string | null
  ubicacion: string | null
  errors: string[]
}

export interface MatchedRow {
  row: ParsedHorseRow
  matchedHorseId: string | null
  matchKey: 'crio_id' | 'microchip' | 'name+birth_date' | null
  action: 'insert' | 'update'
}

export interface MatchResult {
  matched: MatchedRow[]
  unmatched: MatchedRow[]
  missingFromExcel: Array<{ id: string; name: string; hadCrioId: boolean }>
}

export interface ImportSummary {
  success: boolean
  inserted: number
  updated: number
  flaggedMissing: number
  reappeared: number
  errors: string[]
}

export async function parseHorseExcel(formData: FormData): Promise<{ rows: ParsedHorseRow[]; totalRows: number; errorRows: number; errors?: string[] }> {
  const user = await requireUser()
  if (!(await isAdmin(user.id, user.email!))) {
    throw new Error('No autorizado')
  }

  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No se proporcionó archivo')
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // Intentar leer la hoja "CABALLOS ACTIVOS", fallback a la primera
    let sheetName = 'CABALLOS ACTIVOS'
    if (!workbook.Sheets[sheetName]) {
      sheetName = workbook.SheetNames[0]
    }

    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      throw new Error('No se encontró ninguna hoja en el archivo Excel')
    }

    const data = XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false }) as Record<string, any>[]

    // Validar columnas requeridas
    if (data.length === 0) {
      throw new Error('El archivo Excel está vacío')
    }

    const firstRow = data[0]
    const hasNombreCol = 'Nombre' in firstRow
    const hasCrioIdCol = 'ID Caballo' in firstRow

    if (!hasNombreCol && !hasCrioIdCol) {
      throw new Error('Columnas requeridas no encontradas: esperado "Nombre" e "ID Caballo"')
    }

    const rows: ParsedHorseRow[] = []
    let errorCount = 0

    // Procesar en batches para no bloquear
    const BATCH_SIZE = 100
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const errors: string[] = []

      // Parse crio_id (ID Caballo)
      let crio_id: number | null = null
      if (row['ID Caballo']) {
        const parsed = parseInt(String(row['ID Caballo']).trim(), 10)
        if (!isNaN(parsed)) {
          crio_id = parsed
        }
      }

      // Parse nombre
      const name = row['Nombre'] ? String(row['Nombre']).trim() : null

      // Parse gender (Sexo: H/M)
      let gender: string | null = null
      if (row['Sexo']) {
        const s = String(row['Sexo']).trim().toUpperCase()
        if (s === 'H' || s === 'M') {
          gender = s === 'H' ? 'H' : 'M'
        }
      }

      // Parse fecha de nacimiento (Excel serial date)
      let birth_date: string | null = null
      if (row['Fecha de Nacimiento']) {
        try {
          const val = row['Fecha de Nacimiento']
          let dateStr: string | null = null

          // Si es número (serial date)
          if (typeof val === 'number') {
            const parsed = XLSX.SSF.parse_date_code(val)
            if (parsed) {
              const y = parsed.y, m = String(parsed.m).padStart(2, '0'), d = String(parsed.d).padStart(2, '0')
              dateStr = `${y}-${m}-${d}`
            }
          } else if (typeof val === 'string' && val.trim()) {
            // Si es string, intentar parse directo
            const d = new Date(val.trim())
            if (!isNaN(d.getTime())) {
              dateStr = d.toISOString().split('T')[0]
            }
          }

          if (dateStr) {
            birth_date = dateStr
          }
        } catch (e) {
          // Skip fecha si hay error, no es crítica
        }
      }

      // Parse microchip (remover asterisco inicial si existe)
      let microchip: string | null = null
      if (row['Microchip']) {
        const mc = String(row['Microchip']).trim().replace(/^\*/, '')
        if (mc) {
          microchip = mc
        }
      }

      // Parse campos nuevos
      const padre = row['Padre'] ? String(row['Padre']).trim() : null
      const madre = row['Madre'] ? String(row['Madre']).trim() : null
      const raza = row['Raza'] ? String(row['Raza']).trim() : null
      const categoria = row['Categoría'] ? String(row['Categoría']).trim() : null

      // Parse owner (Propietarios)
      const owner = row['Propietarios'] ? String(row['Propietarios']).trim() : null

      // Parse color (Pelo)
      const color = row['Pelo'] ? String(row['Pelo']).trim() : null

      // Parse ubicacion (Full Location preferido)
      let ubicacion: string | null = null
      if (row['Full Location']) {
        ubicacion = String(row['Full Location']).trim()
      } else if (row['Ubicación']) {
        ubicacion = String(row['Ubicación']).trim()
      }

      if (errors.length > 0) {
        errorCount++
      }

      rows.push({
        rowIndex: i,
        crio_id,
        name,
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
        errors,
      })
    }

    return {
      rows,
      totalRows: data.length,
      errorRows: errorCount,
    }
  } catch (error) {
    throw new Error(`Error leyendo archivo Excel: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function matchHorseRows(rows: ParsedHorseRow[]): Promise<MatchResult> {
  const user = await requireUser()
  if (!(await isAdmin(user.id, user.email!))) {
    throw new Error('No autorizado')
  }

  const supabase = await createClient()

  // Recuperar todos los caballos existentes sin límite de 1000
  // Paginar en lotes de 1000 para obtener todos
  let allHorses: any[] = []
  let page = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error: queryError } = await supabase
      .from('horses')
      .select('id, crio_id, microchip, name, birth_date', { count: 'exact' })
      .range(from, to)

    if (queryError) {
      throw new Error(`Error consultando caballos (página ${page}): ${queryError.message}`)
    }

    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allHorses = allHorses.concat(data)
      hasMore = data.length === pageSize
      page++
    }
  }

  const existingHorses = allHorses

  // Construir mapas en memoria
  const byCrioId = new Map<number, string>()
  const byMicrochip = new Map<string, string>()
  const byNameDate = new Map<string, string>()
  const allHorseIds = new Set<string>()

  for (const horse of existingHorses || []) {
    allHorseIds.add(horse.id)
    if (horse.crio_id !== null) {
      byCrioId.set(horse.crio_id, horse.id)
    }
    if (horse.microchip) {
      // Normalizar agresivamente: lowercase, trim, remover espacios y asteriscos
      const normalizedMc = horse.microchip
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '')
        .replace(/^\*+/, '')
        .replace(/\*+$/, '')
      if (normalizedMc) {
        byMicrochip.set(normalizedMc, horse.id)
      }
    }
    if (horse.name && horse.birth_date) {
      const key = `${horse.name.toLowerCase().trim()}|${horse.birth_date}`
      byNameDate.set(key, horse.id)
    }
  }


  // Matchear cada fila
  const matched: MatchedRow[] = []
  const unmatched: MatchedRow[] = []
  const matchedIds = new Set<string>()

  for (const row of rows) {
    let matchedHorseId: string | null = null
    let matchKey: 'crio_id' | 'microchip' | 'name+birth_date' | null = null

    // Cascada: microchip → name+date
    // Solo usa microchip y nombre+fecha, no CRIO ID
    const normalizedMicrochip = row.microchip
      ? row.microchip
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '')
          .replace(/^\*+/, '')
          .replace(/\*+$/, '')
      : ''

    if (normalizedMicrochip && byMicrochip.has(normalizedMicrochip)) {
      matchedHorseId = byMicrochip.get(normalizedMicrochip)!
      matchKey = 'microchip'
    } else if (row.name && row.birth_date) {
      const key = `${row.name.toLowerCase().trim()}|${row.birth_date}`
      if (byNameDate.has(key)) {
        matchedHorseId = byNameDate.get(key)!
        matchKey = 'name+birth_date'
      }
    }

    const mrow: MatchedRow = {
      row,
      matchedHorseId,
      matchKey,
      action: matchedHorseId ? 'update' : 'insert',
    }

    if (matchedHorseId) {
      matched.push(mrow)
      matchedIds.add(matchedHorseId)
    } else {
      unmatched.push(mrow)
    }
  }

  // Encontrar caballos que no aparecen en el Excel
  const missingFromExcel: Array<{ id: string; name: string; hadCrioId: boolean }> = []
  for (const horse of existingHorses || []) {
    if (!matchedIds.has(horse.id) && horse.crio_id !== null) {
      // Solo marcar "faltante" si ya tenía crio_id (fue sincronizado con CRIO antes)
      missingFromExcel.push({
        id: horse.id,
        name: horse.name,
        hadCrioId: true,
      })
    }
  }

  return {
    matched,
    unmatched,
    missingFromExcel,
  }
}

export async function commitHorseImport(matchResult: MatchResult): Promise<ImportSummary> {
  const user = await requireUser()
  if (!(await isAdmin(user.id, user.email!))) {
    throw new Error('No autorizado')
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  let inserted = 0
  let updated = 0
  let flaggedMissing = 0
  let reappeared = 0
  const errors: string[] = []

  try {
    // Procesar inserts y updates en batches
    const BATCH_SIZE = 500
    // Combinar matched (updates) y unmatched (inserts)
    const toProcess = [...matchResult.matched, ...matchResult.unmatched]

    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
      const batch = toProcess.slice(i, i + BATCH_SIZE)

      // Separar inserts y updates
      const inserts = batch.filter((m) => m.action === 'insert').map((m) => ({
        name: m.row.name || '',
        color: m.row.color,
        status: 'active',
        registration: null,
        owner: m.row.owner,
        trainer: null,
        birth_date: m.row.birth_date,
        microchip: m.row.microchip,
        gender: m.row.gender,
        ubicacion: m.row.ubicacion,
        crio_id: m.row.crio_id,
        padre: m.row.padre,
        madre: m.row.madre,
        raza: m.row.raza,
        categoria: m.row.categoria,
        excel_imported_at: now,
        last_seen_at: now,
        crio_not_found_since: null,
      }))

      const updates = batch.filter((m) => m.action === 'update').map((m) => ({
        id: m.matchedHorseId!,
        name: m.row.name || '',
        color: m.row.color,
        owner: m.row.owner,
        birth_date: m.row.birth_date,
        microchip: m.row.microchip,
        gender: m.row.gender,
        ubicacion: m.row.ubicacion,
        crio_id: m.row.crio_id,
        padre: m.row.padre,
        madre: m.row.madre,
        raza: m.row.raza,
        categoria: m.row.categoria,
        excel_imported_at: now,
        last_seen_at: now,
        crio_not_found_since: null,
      }))

      if (inserts.length > 0) {
        // Buscar caballos existentes por crio_id
        const crioIds = inserts.map(r => r.crio_id).filter(id => id !== null)
        const existingByCrio: Record<number, string> = {}

        if (crioIds.length > 0) {
          const { data: existing } = await supabase
            .from('horses')
            .select('id, crio_id')
            .in('crio_id', crioIds)

          if (existing) {
            for (const horse of existing) {
              existingByCrio[horse.crio_id as number] = horse.id
            }
          }
        }

        // Separar: caballos existentes (update) y nuevos (insert)
        const toUpsert = []
        const toInsertNew = []

        for (const row of inserts) {
          if (row.crio_id !== null && existingByCrio[row.crio_id]) {
            // Existe por crio_id, agregar ID para upsert
            toUpsert.push({ ...row, id: existingByCrio[row.crio_id] })
          } else {
            // No existe, insertar nuevo
            toInsertNew.push(row)
          }
        }

        // Insertar nuevos
        if (toInsertNew.length > 0) {
          const { error: insertError, data: insertedData } = await supabase
            .from('horses')
            .insert(toInsertNew)
            .select('id')

          if (insertError) {
            errors.push(`Error insertando: ${insertError.message}`)
          } else {
            inserted += insertedData?.length || 0
          }
        }

        // Upsert los existentes (por ID)
        if (toUpsert.length > 0) {
          const { error: upsertError, data: upsertedData } = await supabase
            .from('horses')
            .upsert(toUpsert, { onConflict: 'id' })
            .select('id')

          if (upsertError) {
            errors.push(`Error actualizando: ${upsertError.message}`)
          } else {
            updated += upsertedData?.length || 0
          }
        }
      }

      if (updates.length > 0) {
        const { error: updateError, data: updatedData } = await supabase
          .from('horses')
          .upsert(updates, { onConflict: 'id' })
          .select('id')

        if (updateError) {
          errors.push(`Error actualizando batch: ${updateError.message}`)
        } else {
          updated += updatedData?.length || 0
        }
      }
    }

    // Marcar caballos faltantes
    if (matchResult.missingFromExcel.length > 0) {
      const missingIds = matchResult.missingFromExcel.map((m) => m.id)

      const { error: flagError } = await supabase
        .from('horses')
        .update({ crio_not_found_since: now })
        .in('id', missingIds)
        .is('crio_not_found_since', null) // Solo si no ya marcado

      if (flagError) {
        errors.push(`Error marcando como faltantes: ${flagError.message}`)
      } else {
        flaggedMissing = missingIds.length
      }
    }

    // Limpiar flag en caballos que reaparecieron
    if (matchResult.matched.length > 0) {
      const reappearedIds = matchResult.matched
        .filter((m) => m.action === 'update')
        .map((m) => m.matchedHorseId!)

      if (reappearedIds.length > 0) {
        const { error: cleanError, data: cleanedData } = await supabase
          .from('horses')
          .update({ crio_not_found_since: null })
          .in('id', reappearedIds)
          .not('crio_not_found_since', 'is', null)
          .select('id')

        if (cleanError) {
          errors.push(`Error limpiando flag: ${cleanError.message}`)
        } else {
          reappeared = cleanedData?.length || 0
        }
      }
    }

    // Revalidar cachés
    revalidatePath('/horses')
    revalidatePath('/dashboard')

    return {
      success: errors.length === 0,
      inserted,
      updated,
      flaggedMissing,
      reappeared,
      errors,
    }
  } catch (error) {
    return {
      success: false,
      inserted,
      updated,
      flaggedMissing,
      reappeared,
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}
