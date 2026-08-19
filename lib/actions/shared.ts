'use server'

export async function getVetName(supabase: any, user: any): Promise<string> {
  try {
    const { data: profile } = await supabase.from('profiles').select('first_name, last_name, active_vet_id').eq('id', user.id).single()
    if (profile?.active_vet_id) {
      const { data: vet } = await supabase.from('profiles').select('first_name, last_name').eq('id', profile.active_vet_id).single()
      if (vet) {
        const full = `${vet.first_name ?? ''} ${vet.last_name ?? ''}`.trim()
        if (full) return full
      }
    }
    if (profile) {
      const full = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
      if (full) return full
    }
  } catch {}
  return user.email
}

export async function getCreatedForVetId(supabase: any, user: any): Promise<string> {
  try {
    const { data: profile } = await supabase.from('profiles').select('active_vet_id').eq('id', user.id).single()
    if (profile?.active_vet_id) return profile.active_vet_id
  } catch {}
  return user.id
}
