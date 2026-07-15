'use server'

export async function getVetName(supabase: any, user: any): Promise<string> {
  try {
    const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single()
    if (data) {
      const full = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim()
      if (full) return full
    }
  } catch {}
  return user.email
}
