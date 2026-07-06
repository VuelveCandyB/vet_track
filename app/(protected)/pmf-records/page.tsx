import { requireUser, isAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import TreatmentReportsPageClient from './page-client'
import type { TreatmentReport } from '@/lib/types'

export default async function TreatmentReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const user = await requireUser()
  const admin = isAdmin(user.email!)
  const { estado } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('pmf_records')
    .select('*')
    .order('created_at', { ascending: false })

  if (estado) {
    query = query.eq('estado', estado)
  }

  const { data: reportData } = await query

  // Get all unique horse IDs and fetch their data
  const horseIds = [...new Set((reportData ?? []).map((r: any) => r.horse_id).filter(Boolean))]
  let horsesMap: Record<string, any> = {}

  if (horseIds.length > 0) {
    const { data: horsesData } = await supabase
      .from('horses')
      .select('id, name, registration')
      .in('id', horseIds)

    if (horsesData) {
      horsesMap = Object.fromEntries(horsesData.map(h => [h.id, h]))
    }
  }

  // Enrich reports with horse data
  const reports = (reportData ?? []).map((report: any) => ({
    ...report,
    horses: report.horse_id ? horsesMap[report.horse_id] : null
  })) as (TreatmentReport & {
    horses?: { name: string; registration?: string }
    drug?: { nombre: string; tipo_restriccion?: string }
  })[]

  return (
    <TreatmentReportsPageClient
      reports={reports}
      currentEstado={estado}
      isAdmin={admin}
    />
  )
}
