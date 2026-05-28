'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

export async function createHorse(formData: FormData) {
  await requireUser()
  const supabase = await createClient()

  const payload = {
    name:         (formData.get('name') as string).toUpperCase().trim(),
    color:        formData.get('color') as string,
    registration: (formData.get('registration') as string) || null,
    owner:        (formData.get('owner') as string) || null,
    trainer:      (formData.get('trainer') as string) || null,
    status:       (formData.get('status') as string) || 'active',
    birth_date:   (formData.get('birth_date') as string) || null,
  }

  const { data, error } = await supabase.from('horses').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  redirect(`/horses/${data.id}`)
}

