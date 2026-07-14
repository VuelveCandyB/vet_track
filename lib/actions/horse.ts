'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

const supabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function registerHorseInLOES(horseId: string) {
  try {
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('horses')
      .update({
        en_loes: true,
        fecha_ingreso_loes: now,
      })
      .eq('id', horseId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function removeAllHorsesFromLOES() {
  try {
    const { data, error } = await supabase
      .from('horses')
      .update({
        en_loes: false,
        fecha_ingreso_loes: null,
      })
      .eq('en_loes', true)
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, removed: data?.length || 0 }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

