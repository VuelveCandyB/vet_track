'use server'
import { load } from 'cheerio'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

const BASE_URL = 'https://hipodromocamarero.crioonline.com/App/Guest/GroupOfHorses/1364'
const CONCURRENCY = 5 // páginas en paralelo a la vez

const COLOR_MAP: Record<string, string> = {
  BAY: 'Bay', DKBAY: 'Dark Bay', CHEST: 'Chestnut',
  GREY: 'Grey', GRAY: 'Grey', ROAN: 'Roan', BLACK: 'Black',
}
const GENDER_MAP: Record<string, string> = {
  Hembra: 'F', Macho: 'M', Castrado: 'C',
}

function parseDate(raw: string): string | null {
  raw = raw.trim()
  if (!raw) return null
  const dmY = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (dmY) return `${dmY[3]}-${dmY[2]}-${dmY[1]}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  return null
}

function parsePage(html: string): any[] {
  const $ = load(html)
  const horses: any[] = []
  $('tbody tr').each((_, tr) => {
    const tds = $(tr).find('td')
    if (tds.length < 7) return
    const name = $(tds[1]).text().trim()
    if (!name) return
    const colorRaw = $(tds[2]).text().trim().toUpperCase()
    const genderTag = $(tds[0]).find('[title]').attr('title')
    horses.push({
      name,
      color:        COLOR_MAP[colorRaw] ?? (colorRaw ? colorRaw.charAt(0) + colorRaw.slice(1).toLowerCase() : null),
      registration: $(tds[4]).text().trim() || null,
      microchip:    $(tds[5]).text().trim().replace(/^\*/, '') || null,
      birth_date:   parseDate($(tds[6]).text().trim()),
      gender:       genderTag ? (GENDER_MAP[genderTag] ?? null) : null,
      status:       'active',
    })
  })
  return horses
}

function totalPages(html: string): number {
  const match = html.match(/de\s+(\d+)/)
  return match ? parseInt(match[1]) : 1
}

function stableKey(h: any): string {
  if (h.microchip) return `chip:${h.microchip}`
  return `name:${(h.name ?? '').trim().toLowerCase()}:${h.birth_date ?? ''}`
}

async function fetchPage(page: number): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}?page=${page}`, { cache: 'no-store' })
    return await res.text()
  } catch {
    return null
  }
}

export async function syncHorses(): Promise<{ total: number; inserted: number; updated: number; errors: string[] }> {
  await requireUser()
  const supabase = await createClient()
  const errors: string[] = []

  // Fetch primera página
  const firstHtml = await fetchPage(1)
  if (!firstHtml) return { total: 0, inserted: 0, updated: 0, errors: ['No se pudo conectar al sitio externo'] }

  const numPages = totalPages(firstHtml)
  const allHorses = parsePage(firstHtml)

  // Fetch páginas restantes EN PARALELO (en grupos de CONCURRENCY)
  // y fetch de DB existente simultáneamente
  const remainingPages = Array.from({ length: numPages - 1 }, (_, i) => i + 2)

  const [pageResults, existingRes] = await Promise.all([
    // Páginas en chunks paralelos
    (async () => {
      const results: any[][] = []
      for (let i = 0; i < remainingPages.length; i += CONCURRENCY) {
        const chunk = remainingPages.slice(i, i + CONCURRENCY)
        const htmls = await Promise.all(chunk.map(fetchPage))
        for (let j = 0; j < htmls.length; j++) {
          if (htmls[j]) results.push(parsePage(htmls[j]!))
          else errors.push(`Error en página ${chunk[j]}`)
        }
      }
      return results
    })(),
    // DB en paralelo con el scraping
    supabase.from('horses').select('id, name, microchip, birth_date').limit(10000),
  ])

  for (const batch of pageResults) allHorses.push(...batch)

  if (!allHorses.length) return { total: 0, inserted: 0, updated: 0, errors: ['No se encontraron caballos'] }

  // Índice de existentes
  const existingIndex: Record<string, string> = {}
  for (const h of existingRes.data ?? []) {
    if (h.microchip) existingIndex[`chip:${h.microchip}`] = h.id
    else existingIndex[`name:${(h.name ?? '').trim().toLowerCase()}:${h.birth_date ?? ''}`] = h.id
  }

  const now = new Date().toISOString()
  const toInsert: any[] = []
  const toUpdateIds: string[] = []

  for (const horse of allHorses) {
    const key = stableKey(horse)
    if (!existingIndex[key]) toInsert.push({ ...horse, last_seen_at: now })
    else toUpdateIds.push(existingIndex[key])
  }

  let inserted = 0
  let updated  = 0

  // Inserts en batches de 100 paralelos
  const insertBatches = []
  for (let i = 0; i < toInsert.length; i += 100) {
    insertBatches.push(toInsert.slice(i, i + 100))
  }
  const insertResults = await Promise.all(
    insertBatches.map(batch => supabase.from('horses').insert(batch))
  )
  for (let i = 0; i < insertResults.length; i++) {
    if (insertResults[i].error) errors.push(`INSERT lote ${i + 1}: ${insertResults[i].error!.message}`)
    else inserted += insertBatches[i].length
  }

  // Un solo UPDATE por batch de IDs en vez de uno por caballo
  for (let i = 0; i < toUpdateIds.length; i += 500) {
    const { error } = await supabase
      .from('horses')
      .update({ last_seen_at: now })
      .in('id', toUpdateIds.slice(i, i + 500))
    if (error) errors.push(`UPDATE batch: ${error.message}`)
    else updated += Math.min(500, toUpdateIds.length - i)
  }

  revalidatePath('/horses')
  return { total: allHorses.length, inserted, updated, errors }
}
