import { requireUser, isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminTabs from '@/components/admin/admin-tabs'
import DrugManager from '@/components/admin/drug-manager'
import type { Drug } from '@/lib/types'
import { PALETTE } from '@/lib/palette'

export default async function AdminDrugsPage() {
  const user = await requireUser()
  if (!isAdmin(user.email!)) redirect('/dashboard')

  const supabase = await createClient()
  const { data: drugs } = await supabase.from('drugs').select('*').order('categoria').order('nombre')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-sans)', color: PALETTE.primary.green }}>Admin</h1>
        <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>Gestión del sistema</p>
      </div>
      <AdminTabs active="drugs" />
      <DrugManager drugs={(drugs ?? []) as Drug[]} />
    </div>
  )
}
