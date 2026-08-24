import { requirePageAccess, requireUser, isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import TreatmentReportsPageClient from './page-client'
import type { TreatmentReport } from '@/lib/types'

export default async function TreatmentReportsPage() {
  await requirePageAccess('page.treatment_reports')
  const user = await requireUser()
  const userIsAdmin = await isAdmin(user.id, user.email!)
  const supabase = await createClient()

  const { data: reportData } = await supabase
    .from('treatment_reports')
    .select('*, horse:horses(name, registration), medications:treatment_report_medications(*, drug:drugs(nombre, categoria, tipo_restriccion))')
    .order('created_at', { ascending: false })

  const reports = (reportData ?? []) as (TreatmentReport & {
    horse?: { name: string; registration?: string }
    medications?: Array<{ drug?: { nombre: string; categoria?: string; tipo_restriccion?: string } }>
  })[]

  return (
    <TreatmentReportsPageClient reports={reports} currentUserId={user.id} isAdmin={userIsAdmin} />
  )
}
