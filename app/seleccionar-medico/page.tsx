import { requireUser, isTechnician } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SelectVetForm from '@/components/technician/select-vet-form'
import { PALETTE } from '@/lib/palette'

export default async function SelectVetPage() {
  const user = await requireUser()
  const isTech = await isTechnician(user.id, user.email!)

  if (!isTech) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  // Get assigned vets for this technician
  const { data: supervisors } = await supabase
    .from('technician_supervisors')
    .select('vet_id')
    .eq('technician_id', user.id)

  const vetIds = supervisors?.map(s => s.vet_id) ?? []

  if (vetIds.length === 0) {
    redirect('/dashboard')
  }

  // Get vet profiles
  const { data: vets } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', vetIds)
    .order('first_name', { ascending: true })

  const typedVets = (vets ?? []).map(v => ({
    id: v.id,
    name: `${v.first_name ?? ''} ${v.last_name ?? ''}`.trim() || v.id,
  }))

  if (typedVets.length === 0) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: PALETTE.primary.green }}>
            Seleccionar Médico
          </h1>
          <p className="text-sm" style={{ color: PALETTE.text.secondary }}>
            Elige con cuál médico trabajarás en esta sesión
          </p>
        </div>

        <SelectVetForm vets={typedVets} />
      </div>
    </div>
  )
}
