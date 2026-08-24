'use server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export async function logActivity(params: {
  user: User
  action: string
  entityType: string
  entityId?: string | null
  horseId?: string | null
  description: string
}) {
  try {
    const supabase = await createClient()

    // Get user name from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', params.user.id)
      .single()

    const userName = profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      : params.user.email || 'Unknown'

    await supabase.from('activity_logs').insert({
      user_id: params.user.id,
      user_name: userName,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      horse_id: params.horseId,
      description: params.description,
    })
  } catch (error) {
    console.error('logActivity failed:', error)
    // Never throw - logging failures should not break the main action
  }
}

export async function logLoginActivity(user: User) {
  return logActivity({
    user,
    action: 'auth.login',
    entityType: 'auth',
    description: `Usuario autenticado: ${user.email || 'unknown'}`,
  })
}
