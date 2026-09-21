/**
 * InCompass API integration module
 * Handles horse search and data retrieval from the InCompass external service
 */

export interface IncompassHorseDam {
  horseName: string | null
  registrationNumber: string | null
}

export interface IncompassMarking {
  markPartId: string | null
  text1: string | null
  text2: string | null
}

export interface IncompassHorseData {
  horseName: string | null
  registrationNumber: string | null
  microchipNumber: string | null
  tattoo: string | null
  dob: string | null // MM/DD/YYYY
  breed: string | null
  sex: string | null // G, C, H, M, F, etc.
  sexDescription: string | null
  color: string | null
  colorDescription: string | null
  dam: IncompassHorseDam | null
  markings: IncompassMarking[] | null
}

export interface IncompassSearchResult {
  found: boolean
  data?: IncompassHorseData
  error?: string
}

/**
 * Search for a horse in InCompass by microchip number
 */
export async function searchIncompassHorse(
  chipNumber: string
): Promise<IncompassSearchResult> {
  const apiKey = process.env.INCOMPASS_API_KEY
  const baseUrl = process.env.INCOMPASS_BASE_URL

  if (!apiKey || !baseUrl) {
    throw new Error('InCompass API credentials not configured (INCOMPASS_API_KEY or INCOMPASS_BASE_URL missing)')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000) // 15 second timeout

  try {
    const response = await fetch(`${baseUrl}/external/horse/search`, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chipNumber }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    // Handle 404 - horse not found
    if (response.status === 404) {
      return { found: false }
    }

    // Handle other HTTP errors
    if (!response.ok) {
      const errorText = await response.text()
      const statusMessage = `HTTP ${response.status}`

      if (response.status === 401 || response.status === 403) {
        throw new Error(`InCompass authentication failed: ${statusMessage}`)
      }

      throw new Error(`InCompass API error: ${statusMessage}. ${errorText}`)
    }

    // Parse response
    const data = (await response.json()) as IncompassHorseData
    return { found: true, data }
  } catch (error) {
    clearTimeout(timeout)

    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('InCompass API request timeout (15s)')
    }

    // Network errors
    if (error instanceof TypeError) {
      throw new Error(`InCompass network error: ${error.message}`)
    }

    // Re-throw known errors
    if (error instanceof Error) {
      throw error
    }

    throw new Error('Unknown error while querying InCompass API')
  }
}

/**
 * Parse date from MM/DD/YYYY format to YYYY-MM-DD
 */
export function parseDateFromIncompass(dateStr: string | null): string | null {
  if (!dateStr) return null

  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const [, month, day, year] = match
  return `${year}-${month}-${day}`
}

/**
 * Map InCompass sex code to local gender format (H/M)
 * G/C/H (gelding/colt/horse) -> M (Macho)
 * M/F (mare/filly) -> H (Hembra)
 */
export function mapSexToGender(sexCode: string | null): string | null {
  if (!sexCode) return null

  const normalized = sexCode.toUpperCase().trim()

  // Male codes: G (gelding), C (colt), H (horse)
  if (['G', 'C', 'H'].includes(normalized)) return 'M'

  // Female codes: M (mare), F (filly)
  if (['M', 'F'].includes(normalized)) return 'H'

  // Unknown code - return null so local value is preserved
  return null
}
