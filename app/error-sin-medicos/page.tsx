import { requireUser } from '@/lib/auth'
import Link from 'next/link'
import { PALETTE } from '@/lib/palette'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SinMedicosPage() {
  const user = await requireUser()
  const supabase = await createClient()

  // Verify this user is actually a technician without supervisors
  const { data: supervisors } = await supabase
    .from('technician_supervisors')
    .select('vet_id')
    .eq('technician_id', user.id)

  const vetIds = supervisors?.map(s => s.vet_id) ?? []

  // If user actually has supervisors, redirect to dashboard
  if (vetIds.length > 0) {
    redirect('/dashboard')
  }

  return (
    <div className="flex items-center justify-center min-h-[100dvh] px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="space-y-2">
          <div className="text-5xl font-bold" style={{ color: PALETTE.primary.green }}>⚠️</div>
          <h1 className="text-2xl font-bold" style={{ color: PALETTE.text.dark }}>Sin médicos asignados</h1>
        </div>

        <p className="text-sm" style={{ color: PALETTE.text.secondary }}>
          Tu cuenta no tiene ningún médico supervisor asignado. Contacta al administrador del sistema para que configure tus asignaciones.
        </p>

        <div className="pt-4 space-y-3">
          <Link
            href="/perfil"
            className="block w-full px-4 py-2.5 rounded-lg text-sm font-medium text-center transition-colors"
            style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}
          >
            Ver mi perfil
          </Link>

          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: '#E5E7EB', color: PALETTE.text.dark }}
            >
              Cerrar sesión
            </button>
          </form>
        </div>

        <p className="text-xs pt-4" style={{ color: PALETTE.text.secondary }}>
          Si crees que esto es un error, contacta al administrador del sistema
        </p>
      </div>
    </div>
  )
}
