'use server'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import { createClient } from '@/lib/supabase/server'
import { requireUser, isAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const euFile = 'C:\\Users\\cabal\\OneDrive - Camarero Race Track Corporation\\Eu - data.xlsx'

export interface EuthanasiaImportResult {
  success: boolean
  matched: number
  updated: number
  errors: string[]
}

export async function importEuthanasiaRecords(): Promise<EuthanasiaImportResult> {
  const user = await requireUser()
  if (!(await isAdmin(user.id, user.email!))) {
    return {
      success: false,
      matched: 0,
      updated: 0,
      errors: ['No autorizado'],
    }
  }

  try {
    // Leer archivo de eutanasia
    if (!fs.existsSync(euFile)) {
      return {
        success: false,
        matched: 0,
        updated: 0,
        errors: [`Archivo no encontrado: ${euFile}`],
      }
    }

    const workbook = XLSX.readFile(euFile)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false }) as Record<string, any>[]

    // Extraer nombres, fechas de eutanasia y última carrera
    const euRecords = data
      .map(row => {
        // Parse death date
        let death_date: string | null = null
        const deathDateVal = row['Death Date']
        if (deathDateVal) {
          if (typeof deathDateVal === 'number') {
            // Excel serial date
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

        // Parse last race date
        let last_race_date: string | null = null
        const lastRaceVal = row['Last Race Date (desde Equibase)']
        if (lastRaceVal) {
          if (typeof lastRaceVal === 'number') {
            const parsed = XLSX.SSF.parse_date_code(lastRaceVal)
            if (parsed) {
              const y = parsed.y
              const m = String(parsed.m).padStart(2, '0')
              const d = String(parsed.d).padStart(2, '0')
              last_race_date = `${y}-${m}-${d}`
            }
          } else if (typeof lastRaceVal === 'string') {
            last_race_date = lastRaceVal.trim()
          }
        }

        return {
          name: (row['CABALLO Nombre'] || '').toString().trim().toUpperCase(),
          death_date,
          last_race_date,
          reason: (row['RAZON '] || '').toString().trim(),
        }
      })
      .filter(r => r.name.length > 0)

    // Conectar a Supabase
    const supabase = await createClient()

    // Buscar exactos en BD (case-insensitive)
    // Obtener todos los caballos y hacer matching en memoria
    const { data: allHorses, error: matchError } = await supabase
      .from('horses')
      .select('id, name, status')

    if (matchError) {
      return {
        success: false,
        matched: 0,
        updated: 0,
        errors: [`Error buscando caballos: ${matchError.message}`],
      }
    }

    // Hacer matching case-insensitive
    const euNameSet = new Set(euRecords.map(r => r.name))
    const exactMatches = (allHorses || []).filter(h =>
      euNameSet.has(h.name.toUpperCase())
    )

    if (!exactMatches || exactMatches.length === 0) {
      return {
        success: true,
        matched: 0,
        updated: 0,
        errors: [],
      }
    }

    // Mapear horse_id → eu record para acceso rápido
    const euMap = new Map(euRecords.map(r => [r.name, r]))

    // Actualizar status a 'deceased' para los que matchearon
    const horsesToUpdate = exactMatches.map(h => ({
      id: h.id,
      status: 'deceased',
      updated_at: new Date().toISOString(),
    }))

    // Batch update horses
    const { error: updateError } = await supabase
      .from('horses')
      .upsert(horsesToUpdate, { onConflict: 'id' })

    if (updateError) {
      return {
        success: false,
        matched: exactMatches.length,
        updated: 0,
        errors: [`Error actualizando caballos: ${updateError.message}`],
      }
    }

    // Crear registros de eutanasia
    const euthanasiaRecords = exactMatches
      .map(horse => {
        const euRecord = euMap.get(horse.name)
        if (!euRecord || !euRecord.death_date) return null

        return {
          horse_id: horse.id,
          fecha: euRecord.death_date,
          motivo: euRecord.reason || 'Importado desde registro de CRIO',
          vet_name: 'Sistema (Importación CRIO)',
          propietario_notificado: false,
          created_by: user.id,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    if (euthanasiaRecords.length > 0) {
      const { error: euError } = await supabase.from('euthanasia').insert(euthanasiaRecords)

      if (euError) {
        console.error('Advertencia: Error creando registros de eutanasia:', euError.message)
        // No fallar la importación si hay error en euthanasia
      }
    }

    // Revalidar paths
    revalidatePath('/horses')
    revalidatePath('/dashboard')

    return {
      success: true,
      matched: exactMatches.length,
      updated: exactMatches.length,
      errors: [],
    }
  } catch (error) {
    return {
      success: false,
      matched: 0,
      updated: 0,
      errors: [error instanceof Error ? error.message : 'Error desconocido'],
    }
  }
}
