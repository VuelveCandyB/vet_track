import { requireUser, isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { addCatalogItem, deleteCatalogItem } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AdminTabs from '@/components/admin/admin-tabs'
import ConfirmDeleteButton from '@/components/admin/confirm-delete-button'

const CATEGORIES: Record<string, string> = {
  med_type: 'Tipos de Medicamento',
  dose:     'Tipos de Dosis',
}

export default async function AdminCatalogPage() {
  const user = await requireUser()
  if (!isAdmin(user.email!)) redirect('/dashboard')

  const supabase = await createClient()
  const { data: rows } = await supabase.from('catalog_items').select('*').eq('active', true).order('sort_order')

  const grouped: Record<string, any[]> = { med_type: [], dose: [] }
  for (const row of rows ?? []) {
    if (row.category in grouped) grouped[row.category].push(row)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: '"Dela Gothic One", sans-serif' }}>
          Admin
        </h1>
        <p className="text-sm mt-1" style={{ color: '#4a5280' }}>Gestión del sistema</p>
      </div>

      <AdminTabs active="catalog" />

      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(CATEGORIES).map(([cat, label]) => (
          <div key={cat} className="rounded-xl overflow-hidden" style={{ background: '#131829', border: '1px solid #252d4a' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #252d4a' }}>
              <h2 className="text-sm font-semibold text-white">{label}</h2>
              <span className="text-xs" style={{ color: '#4a5280' }}>{grouped[cat].length} items</span>
            </div>

            {/* Add form */}
            <form action={addCatalogItem} className="flex gap-2 px-4 py-3" style={{ borderBottom: '1px solid #1e2235' }}>
              <input type="hidden" name="category" value={cat} />
              <Input name="name" placeholder="Nuevo ítem..." className="flex-1 h-8 text-sm" />
              <Button type="submit" size="sm" style={{ background: '#2B55F4' }}>+</Button>
            </form>

            {/* Items */}
            <div className="divide-y" style={{ borderColor: '#1e2235' }}>
              {grouped[cat].map((item: any) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-sm" style={{ color: '#e2e8f0' }}>{item.name}</span>
                  <ConfirmDeleteButton
                    action={deleteCatalogItem.bind(null, item.id)}
                    message={`¿Eliminar "${item.name}"?`}
                    className="text-xs transition-colors hover:text-red-400 px-1"
                    style={{ background: 'none', border: 'none', color: '#4a5280', cursor: 'pointer' }}>
                    ✕
                  </ConfirmDeleteButton>
                </div>
              ))}
              {grouped[cat].length === 0 && (
                <div className="px-5 py-4 text-sm text-center" style={{ color: '#4a5280' }}>Sin items</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
