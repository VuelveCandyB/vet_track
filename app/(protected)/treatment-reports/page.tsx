import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import TreatmentReportsPageClient from './page-client'
import type { TreatmentReport } from '@/lib/types'

export default async function TreatmentReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  await requireUser()
  const { estado } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('treatment_reports')
    .select('*, horse:horses(name, registration), drug:drugs(nombre, tipo_restriccion)')
    .order('created_at', { ascending: false })

  if (estado) {
    query = query.eq('estado', estado)
  }

  const { data: reportData } = await query

  const reports = (reportData ?? []) as (TreatmentReport & {
    horse?: { name: string; registration?: string }
    drug?: { nombre: string; tipo_restriccion?: string }
  })[]

  return (
    <TreatmentReportsPageClient
      reports={reports}
      currentEstado={estado}
    />
  )
}
