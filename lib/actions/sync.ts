'use server'
import { load } from 'cheerio'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

const BASE_URL = 'https://hipodromocamarero.crioonline.com/App/Guest/GroupOfHorses/1364'
const MIN_DELAY_MS = 800
const MAX_DELAY_MS = 20000
const MAX_CONSECUTIVE_FAILURES = 5

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
    const $tr = $(tr)
    const tds = $tr.find('td')

    // Extract by cell index (no data-field attributes)
    // td[0] = gender icon (skip)
    // td[1] = name
    // td[2] = color
    // td[3] = empty (ID)
    // td[4] = registration
    // td[5] = microchip
    // td[6] = birth_date
    // td[7] = ubicacion
    // td[8] = age (skip)

    if (tds.length < 7) return

    const name = $(tds[1]).text().trim() || null
    if (!name) return

    const colorRaw = $(tds[2]).text().trim().toUpperCase()
    const registration = $(tds[4]).text().trim() || null
    const microchip_raw = $(tds[5]).text().trim()
    const birth_date_str = $(tds[6]).text().trim()
    const ubicacion = $(tds[7]).text().trim() || null

    horses.push({
      name,
      color:        COLOR_MAP[colorRaw] ?? (colorRaw ? colorRaw.charAt(0) + colorRaw.slice(1).toLowerCase() : null),
      registration: registration || null,
      microchip:    microchip_raw.replace(/^\*/, '') || null,
      birth_date:   parseDate(birth_date_str),
      ubicacion:    ubicacion || null,
      gender:       null, // Gender determined by icon, not easily extractable
      status:       'active',
      detail_url_id: null, // Not available in this HTML structure
    })
  })

  console.log(`[SYNC-PARSE] Parsed ${horses.length} horses from page`)
  return horses
}

function totalPages(html: string): number {
  const match = html.match(/de\s+(\d+)/)
  return match ? parseInt(match[1]) : 1
}

function keysFor(h: any): string[] {
  const keys: string[] = []
  if (h.detail_url_id) keys.push(`detail:${h.detail_url_id}`)
  if (h.microchip) keys.push(`chip:${h.microchip}`)
  if (h.registration) keys.push(`reg:${h.registration.trim().toLowerCase()}`)
  keys.push(`name:${(h.name ?? '').trim().toLowerCase()}:${h.birth_date ?? ''}`)
  return keys
}

async function fetchPageWithBackoff(page: number, currentDelay: number): Promise<{ html: string | null; nextDelay: number }> {
  try {
    console.log(`[SYNC] Fetching page ${page} with ${currentDelay}ms delay...`)

    // Wait before fetching
    await new Promise(r => setTimeout(r, currentDelay))

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const url = `${BASE_URL}?page=${page}`
    console.log(`[SYNC] URL: ${url}`)

    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    console.log(`[SYNC] Page ${page} response status: ${res.status}`)

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After')
      const nextDelay = retryAfter ? Math.min(parseInt(retryAfter) * 1000, MAX_DELAY_MS) : Math.min(currentDelay * 1.7, MAX_DELAY_MS)
      console.log(`[SYNC] Page ${page} returned 429, next delay: ${nextDelay}ms`)
      return { html: null, nextDelay }
    }

    if (!res.ok) {
      console.log(`[SYNC] Page ${page} failed with status ${res.status}`)
      return { html: null, nextDelay: currentDelay }
    }

    const html = await res.text()
    console.log(`[SYNC] Page ${page} loaded (${html.length} bytes)`)
    return { html, nextDelay: Math.max(currentDelay * 0.9, MIN_DELAY_MS) }
  } catch (err: any) {
    console.error(`[SYNC] Error fetching page ${page}:`, err?.message || err)
    return { html: null, nextDelay: currentDelay }
  }
}

async function getOrCreateActiveRun(supabase: any, triggeredBy: string) {
  // Check for active run
  const { data: existing, error: existingError } = await supabase
    .from('horse_sync_runs')
    .select('*')
    .in('status', ['running', 'paused'])
    .order('started_at', { ascending: false })
    .limit(1)

  if (existing && existing.length > 0) {
    console.log(`[SYNC] Resuming run ${existing[0].id} from page ${existing[0].current_page}`)
    return existing[0]
  }

  // Create new run
  const { data: newRun, error: insertError } = await supabase
    .from('horse_sync_runs')
    .insert({ triggered_by: triggeredBy, status: 'running' })
    .select()
    .single()

  if (insertError || !newRun) {
    console.error('[SYNC] Error creating run:', insertError)
    throw new Error(`Failed to create sync run: ${insertError?.message || 'Unknown error'}`)
  }

  console.log(`[SYNC] Created new run ${newRun.id}`)
  return newRun
}

interface SyncBatchResult {
  status: 'running' | 'completed' | 'paused' | 'failed'
  currentPage: number
  totalPages: number | null
  inserted: number
  updated: number
  renamed: number
  chipsCompletados: number
  errors: string[]
}

export async function processSyncBatch(maxPages: number = 10): Promise<SyncBatchResult> {
  await requireUser()
  const supabase = await createClient()

  const run = await getOrCreateActiveRun(supabase, 'manual')
  const runId = run.id
  const startPage = (run.current_page || 0) + 1
  const errors: string[] = [...(run.errors || [])]

  let inserted = 0
  let updated = 0
  let renamed = 0
  let chipsCompletados = 0
  let currentPage = run.current_page || 0
  let totalPages = run.total_pages || null
  let consecutiveFailures = 0
  let currentDelay = MIN_DELAY_MS

  // Fetch total pages if needed
  if (!totalPages) {
    const { html: firstHtml } = await fetchPageWithBackoff(1, MIN_DELAY_MS)
    if (firstHtml) {
      totalPages = totalPages || 1
      const firstPageHorses = parsePage(firstHtml)
      const match = firstHtml.match(/de\s+(\d+)/)
      if (match) totalPages = parseInt(match[1])
      console.log(`[SYNC] Total pages: ${totalPages}`)
    } else {
      return { status: 'failed', currentPage, totalPages, inserted, updated, renamed, chipsCompletados, errors: ['Could not fetch first page'] }
    }
  }

  // Fetch existing horses for matching
  const { data: existingHorses } = await supabase
    .from('horses')
    .select('id, name, microchip, birth_date, color, registration, ubicacion, gender, status, detail_url_id')
    .limit(10000)

  const existingIndex: Record<string, string> = {}
  const existingMap: Record<string, any> = {}
  for (const h of existingHorses || []) {
    existingMap[h.id] = h
    for (const key of keysFor(h)) {
      existingIndex[key] = h.id
    }
  }

  // Process batch of pages
  for (let i = 0; i < maxPages && startPage + i <= totalPages!; i++) {
    const pageNum = startPage + i
    let pageHorses: any[] = []
    let retries = 0

    // Retry logic for 429 and soft failures
    while (retries < 4) {
      const { html, nextDelay } = await fetchPageWithBackoff(pageNum, currentDelay)
      currentDelay = nextDelay

      if (!html) {
        retries++
        if (retries < 4) {
          await new Promise(r => setTimeout(r, currentDelay))
        }
        continue
      }

      pageHorses = parsePage(html)

      // Detect corrupt pages (too few horses)
      if (pageHorses.length === 0 && pageNum > 1) {
        retries++
        if (retries < 4) {
          console.log(`[SYNC] Page ${pageNum} returned 0 horses, retrying...`)
          await new Promise(r => setTimeout(r, currentDelay))
        }
        continue
      }

      consecutiveFailures = 0
      break
    }

    if (pageHorses.length === 0) {
      consecutiveFailures++
      errors.push(`Page ${pageNum}: No horses found after retries`)
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.log(`[SYNC] Too many consecutive failures (${consecutiveFailures}), pausing.`)
        await supabase
          .from('horse_sync_runs')
          .update({ status: 'paused', current_page: currentPage, errors, updated_at: new Date().toISOString() })
          .eq('id', runId)
        return { status: 'paused', currentPage, totalPages, inserted, updated, renamed, chipsCompletados, errors }
      }
      continue
    }

    // Process horses from this page
    const toInsert: any[] = []
    const toUpdate: Array<{ existing: any; scraped: any }> = []

    for (const horse of pageHorses) {
      let matchedId: string | null = null
      for (const key of keysFor(horse)) {
        if (existingIndex[key]) {
          matchedId = existingIndex[key]
          break
        }
      }

      if (!matchedId) {
        toInsert.push({ ...horse, last_seen_at: new Date().toISOString() })
      } else {
        const existing = existingMap[matchedId]
        if (existing.name !== horse.name) renamed++
        if (!existing.microchip && horse.microchip) chipsCompletados++
        toUpdate.push({ existing, scraped: horse })
      }
    }

    // Combine all payloads for batch upsert (handles both inserts and updates)
    const allPayloads: any[] = []

    // New horses (will be inserted)
    allPayloads.push(...toInsert)

    // Existing horses (will be updated)
    allPayloads.push(...toUpdate.map(({ existing, scraped }) => ({
      id: existing.id,
      name: scraped.name,
      color: scraped.color ?? existing.color,
      registration: scraped.registration || existing.registration,
      ubicacion: scraped.ubicacion || existing.ubicacion,
      gender: scraped.gender ?? existing.gender,
      microchip: scraped.microchip || existing.microchip,
      birth_date: scraped.birth_date || existing.birth_date,
      detail_url_id: scraped.detail_url_id || existing.detail_url_id,
      last_seen_at: new Date().toISOString(),
      status: existing.status === 'deceased' ? 'deceased' : 'active',
    })))

    // Single upsert operation for all records
    if (allPayloads.length > 0) {
      const { error: upsertError } = await supabase
        .from('horses')
        .upsert(allPayloads, { onConflict: 'microchip' })

      if (upsertError) {
        errors.push(`Page ${pageNum} upsert: ${upsertError.message}`)
      } else {
        inserted += toInsert.length
        updated += toUpdate.length
      }
    }

    currentPage = pageNum

    // Update run state after each page
    await supabase
      .from('horse_sync_runs')
      .update({
        current_page: currentPage,
        pages_ok: (run.pages_ok || 0) + 1,
        inserted: (run.inserted || 0) + inserted,
        updated: (run.updated || 0) + updated,
        renamed: (run.renamed || 0) + renamed,
        chips_completados: (run.chips_completados || 0) + chipsCompletados,
        errors,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId)

    // Delay between pages
    if (pageNum < totalPages) {
      await new Promise(r => setTimeout(r, currentDelay))
    }
  }

  const isComplete = currentPage >= totalPages!
  const finalStatus = isComplete ? 'completed' : 'running'

  if (isComplete) {
    await supabase
      .from('horse_sync_runs')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId)
    revalidatePath('/horses')
  }

  return {
    status: finalStatus,
    currentPage,
    totalPages,
    inserted,
    updated,
    renamed,
    chipsCompletados,
    errors,
  }
}

// Wrapper for backwards compatibility / simple use
export async function syncHorses(): Promise<{ status: 'running' | 'completed' | 'paused' | 'failed'; total: number; inserted: number; updated: number; renamed?: number; chipsCompletados?: number; errors: string[] }> {
  const result = await processSyncBatch(15)
  return {
    status: result.status,
    total: 0, // Not tracked anymore, use horse_sync_runs table
    inserted: result.inserted,
    updated: result.updated,
    renamed: result.renamed,
    chipsCompletados: result.chipsCompletados,
    errors: result.errors,
  }
}
