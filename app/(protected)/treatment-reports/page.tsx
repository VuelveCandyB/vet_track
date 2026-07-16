import { requirePageAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import TreatmentReportsPageClient from './page-client'
import type { TreatmentReport } from '@/lib/types'

export default async function TreatmentReportsPage() {
  await requirePageAccess('page.treatment_reports')
  const supabase = await createClient()

  const { data: reportData } = await supabase
    .from('treatment_reports')
    .select('*, horse:horses(name, registration), drug:drugs(nombre, tipo_restriccion)')
    .order('created_at', { ascending: false })

  const reports = (reportData ?? []) as (TreatmentReport & {
    horse?: { name: string; registration?: string }
    drug?: { nombre: string; tipo_restriccion?: string }
  })[]

  return (
    <TreatmentReportsPageClient reports={reports} />
  )
}
