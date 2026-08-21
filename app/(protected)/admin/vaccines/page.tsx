import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireUser, isAdmin } from '@/lib/auth'
import AdminTabs from '@/components/admin/admin-tabs'
import VaccineTypeManager from '@/components/admin/vaccine-type-manager'
import { PALETTE } from '@/lib/palette'
import type { VaccineType } from '@/lib/types'

export default async function VaccinesPage() {
  const user = await requireUser()
  if (!await isAdmin(user.id, user.email!)) redirect('/horses')

  const supabase = await createClient()
  const { data: vaccineTypes } = await supabase
    .from('vaccine_types')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: PALETTE.primary.green }}>
          Admin
        </h1>
        <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>Gestión del sistema</p>
      </div>

      <AdminTabs active="vaccines" />

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: PALETTE.text.dark }}>Tipos de Vacunas</h2>
          <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>Gestionar catálogo de vacunas, validez, y flags de requisito</p>
        </div>

        <VaccineTypeManager vaccineTypes={(vaccineTypes ?? []) as VaccineType[]} />
      </div>
    </div>
  )
}
