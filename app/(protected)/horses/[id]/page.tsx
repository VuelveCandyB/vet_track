import { requireUser, canRegisterEuthanasia, isAdmin, isOfficialVet } from '@/lib/auth'
import ConfirmDeleteButton from '@/components/admin/confirm-delete-button'
import { createClient } from '@/lib/supabase/server'
import { deleteMedication } from '@/lib/actions/medications'
import HorseActions from '@/components/horses/horse-actions'
import { Badge } from '@/components/ui/badge'
import AnimatedCapsuleDot from '@/components/timeline/animated-capsule-dot'
import AnimatedDiagnosticoDot from '@/components/timeline/animated-diagnostico-dot'
import AnimatedVaccinationDot from '@/components/timeline/animated-vaccination-dot'
import Link from 'next/link'
import type { Horse, Medication, VetlistEntry, EuthanasiaRecord, Drug, Diagnostico, TreatmentReport, Vaccination } from '@/lib/types'
import { STATUS_LABEL } from '@/lib/constants'
import { PALETTE } from '@/lib/palette'

const STATUS_STYLE: Record<string, string> = {
  active:   'bg-green-100 text-green-800 border-green-300',
  rest:     'bg-yellow-100 text-yellow-800 border-yellow-300',
  injury:   'bg-red-100 text-red-800 border-red-300',
  deceased: 'bg-gray-100 text-gray-700 border-gray-300',
}
const COLOR_STYLE: Record<string, string> = {
  'Bay':      'bg-amber-100 text-amber-800 border-amber-300',
  'Dark Bay': 'bg-slate-100 text-slate-800 border-slate-300',
  'Chestnut': 'bg-orange-100 text-orange-800 border-orange-300',
  'Grey':     'bg-blue-100 text-blue-800 border-blue-300',
  'Roan':     'bg-purple-100 text-purple-800 border-purple-300',
  'Black':    'bg-gray-100 text-gray-800 border-gray-300',
}
const TYPE_COLORS: Record<string, string> = {
  'Vacuna': '#4ade80', 'Vaccine': '#4ade80',
  'Anti-inflamatorio': '#f87171',
  'Antiparasitario': '#34d399', 'Desparasitante': '#34d399',
  'Suplemento': '#facc15',
  'Examen': '#38bdf8',
  'Antibiótico': 'PALETTE.primary.green',
  'Cirugía': '#fb923c',
  'Anestesia': '#a78bfa',
  'Otro': '#9ca3af',
}
const RESTRICTION_STYLE: Record<string, [string, string]> = {
  'WDT':        ['#facc15', '#2e2a0d'],
  'RAT':        ['#60a5fa', '#0d1e2e'],
  'RAT+WDT':    ['#f97316', '#2e1a0d'],
  'Stand Down': ['#f87171', '#2e0d0d'],
}

async function getVetName(supabase: any, user: any): Promise<string> {
  try {
    const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single()
    if (data) {
      const full = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim()
      if (full) return full
    }
  } catch {}
  return user.email
}

export default async function HorseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const { sort = 'desc' } = await searchParams
  const supabase = await createClient()

  const [
    horseRes, medsRes, vetlistRes, euthRes,
    drugsRes, diagRes, treatmentReportsRes, pmfReportsRes, vacRes,
    itemCodesRes, catalogItemsRes, vetName, canEuth, officialVet, profilesRes,
    referidosRes,
  ] = await Promise.all([
    supabase.from('horses').select('*').eq('id', id).single(),
    supabase.from('medications').select('*').eq('horse_id', id).order('administered_at', { ascending: sort === 'asc' }),
    supabase.from('vetlist').select('*').eq('horse_id', id).order('fecha_ingreso', { ascending: false }),
    supabase.from('euthanasia').select('*').eq('horse_id', id).maybeSingle(),
    supabase.from('drugs').select('*').eq('active', true).order('nombre'),
    supabase.from('diagnosticos').select('*').eq('horse_id', id).order('fecha', { ascending: false }),
    supabase.from('treatment_reports').select('*, drug:drugs(nombre, categoria, tipo_restriccion)').eq('horse_id', id).order('fecha_tratamiento', { ascending: false }).limit(10),
    supabase.from('pmf_records').select('*, drug:drugs(nombre, categoria, tipo_restriccion)').eq('horse_id', id).order('fecha_tratamiento', { ascending: false }).limit(5),
    supabase.from('vaccinations').select('*').eq('horse_id', id).order('fecha', { ascending: false }),
    supabase.from('treatment_report_item_codes').select('treatment_report_id, catalog_item_id'),
    supabase.from('catalog_items').select('id, name').eq('category', 'item_code'),
    getVetName(supabase, user),
    canRegisterEuthanasia(user.id, user.email!),
    isOfficialVet(user.id, user.email!),
    supabase.from('profiles').select('id, first_name, last_name, license_number'),
    supabase.from('horse_referidos').select('*').eq('horse_id', id).order('fecha_marcado', { ascending: false }),
  ])

  const horse = horseRes.data as Horse
  const medications = (medsRes.data ?? []) as Medication[]
  const vetlist = (vetlistRes.data ?? []) as VetlistEntry[]
  const euthanasiaRecord = euthRes.data as EuthanasiaRecord | null
  const drugs = (drugsRes.data ?? []) as Drug[]
  const diagnosticos = (diagRes.data ?? []) as Diagnostico[]
  const treatmentReports = (treatmentReportsRes.data ?? []) as (TreatmentReport & { drug?: { nombre: string; categoria?: string; tipo_restriccion?: string } })[]
  const pmfReports = (pmfReportsRes.data ?? []) as (TreatmentReport & { drug?: { nombre: string; categoria?: string; tipo_restriccion?: string } })[]
  const vaccinations = (vacRes.data ?? []) as Vaccination[]
  const referidos = (referidosRes.data ?? []) as any[]

  // Create a map of vet_name -> license_number
  const licenseMap: Record<string, string> = {}
  if (profilesRes.data) {
    (profilesRes.data as any[]).forEach(p => {
      if (p.license_number) {
        const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
        if (fullName) {
          licenseMap[fullName] = p.license_number
        }
      }
    })
  }

  // Map EALLC item codes for treatment reports
  const allItemCodes = (itemCodesRes.data ?? []) as { treatment_report_id: string; catalog_item_id: string }[]
  const allCatalogItems = (catalogItemsRes.data ?? []) as { id: string; name: string }[]
  const treatmentReportIds = new Set(treatmentReports.map(t => t.id))
  const itemCodesForThisHorse = allItemCodes.filter(ic => treatmentReportIds.has(ic.treatment_report_id))
  const catalogItemMap = Object.fromEntries(allCatalogItems.map(ci => [ci.id, ci.name]))
  const reportItemCodesMap = Object.fromEntries(
    treatmentReports.map(tr => [
      tr.id,
      itemCodesForThisHorse
        .filter(ic => ic.treatment_report_id === tr.id)
        .map(ic => catalogItemMap[ic.catalog_item_id])
        .filter(Boolean)
    ])
  )

  const vetlistActiva = vetlist.find(e => !e.fecha_egreso) ?? null

  const today = new Date().toISOString().split('T')[0]
  let diasRestantes: number | null = null
  if (vetlistActiva?.fecha_fin_descanso) {
    diasRestantes = Math.floor(
      (new Date(vetlistActiva.fecha_fin_descanso).getTime() - new Date(today).getTime()) / 86400000
    )
  }

  const userIsAdmin = isAdmin(user.email!)

  return (
    <div style={{
      '--button-bg': PALETTE.primary.green,
      '--button-text': '#FFFFFF',
    } as React.CSSProperties}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Link href="/horses" className="transition-colors hover:text-[#059669]" style={{ color: PALETTE.text.secondary }}>
          ← Caballos
        </Link>
        <span style={{ color: PALETTE.text.secondary }}>/</span>
        <span style={{ color: PALETTE.text.secondary }}>{horse.name}</span>
      </div>

      {/* Horse header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0"
          style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
          {horse.name.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-1" style={{ color: PALETTE.text.dark }}>{horse.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs border ${COLOR_STYLE[horse.color] ?? 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
              {horse.color}
            </Badge>
            <Badge className={`text-xs border ${STATUS_STYLE[horse.status] ?? ''}`}>
              {STATUS_LABEL[horse.status] ?? horse.status}
            </Badge>
            {horse.red_flag && (
              <Badge className="text-xs border bg-red-100 text-red-800 border-red-300">
                Referido
              </Badge>
            )}
            {horse.registration && (
              <span className="text-xs" style={{ color: PALETTE.text.secondary }}>Reg. {horse.registration}</span>
            )}
            {horse.microchip && (
              <span className="font-mono text-xs px-1.5 py-0.5 rounded"
                style={{ background: PALETTE.background.lightAlt, color: PALETTE.primary.green }}>
                {horse.microchip}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Euthanasia banner */}
      {euthanasiaRecord && (
        <div className="rounded-lg px-4 py-3 mb-5 flex items-center gap-4"
          style={{ background: PALETTE.status.error + '15', border: `1px solid ${PALETTE.status.error}` }}>
          <div className="text-sm font-bold" style={{ color: PALETTE.status.error }}>
            CABALLO FALLECIDO — EUTANASIA REGISTRADA
          </div>
          <div className="text-xs ml-2" style={{ color: PALETTE.text.secondary }}>
            {euthanasiaRecord.fecha} · {euthanasiaRecord.vet_name}
          </div>
          {euthanasiaRecord.attachment_url && (
            <a href={euthanasiaRecord.attachment_url} target="_blank"
              className="ml-auto text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'PALETTE.primary.green', background: 'PALETTE.primary.green10', border: '1px solid PALETTE.primary.green30' }}>
              Ver documento
            </a>
          )}
        </div>
      )}

      {/* Referido banner */}
      {horse.red_flag && (
        <div className="rounded-lg px-4 py-3 mb-5 flex items-center gap-4"
          style={{ background: '#dc262615', border: '1px solid #dc2626' }}>
          <div className="text-sm font-bold" style={{ color: '#dc2626' }}>
            REFERIDO — NO SE RECOMIENDA PARA CORRER
          </div>
          <div className="text-xs ml-2" style={{ color: PALETTE.text.secondary }}>
            {horse.red_flag_reason} · {horse.red_flag_by} · {horse.red_flag_date?.slice(0, 10)}
          </div>
        </div>
      )}

      {/* Actions (Client Component — manages modals + status update) */}
      <HorseActions
        horse={horse}
        vetlistActiva={vetlistActiva}
        canEuth={canEuth}
        isAdmin={userIsAdmin}
        isOfficialVet={officialVet}
        vetName={vetName}
        today={today}
        drugs={drugs}
        diasRestantes={diasRestantes}
      />

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

        {/* Left panel */}
        <div className="space-y-4">

          {/* Info */}
          <div className="rounded-lg p-5" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: PALETTE.text.primary }}>
              Información
            </h3>
            {[
              ['Propietario', horse.owner],
              ['Entrenador',  horse.trainer],
              ['Ubicación',   (horse as any).ubicacion],
              ['Nacimiento',  horse.birth_date],
              ['Género',      horse.gender],
              ['Color',       horse.color],
              ['Microchip',   horse.microchip],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center py-2"
                style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                <span className="text-xs" style={{ color: PALETTE.text.secondary }}>{label}</span>
                <span className="text-xs font-semibold text-right max-w-36 break-all"
                  style={{ color: label === 'Microchip' && val ? PALETTE.primary.green : PALETTE.text.primary }}>
                  {val || '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Vetlist history */}
          {vetlist.length > 0 && (
            <div className="rounded-lg p-5" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: PALETTE.text.primary }}>
                Historial Vetlist
              </h3>
              {vetlist.map(entry => (
                <div key={entry.id} className="py-2" style={{ borderBottom: '1px solid #1e2235' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs border ${entry.fecha_egreso ? 'bg-green-950 text-green-400 border-green-900' : 'bg-red-950 text-red-400 border-red-900'}`}>
                      {entry.fecha_egreso ? 'Liberado' : 'Activo'}
                    </Badge>
                    <span className="text-xs" style={{ color: PALETTE.text.primary }}>{entry.motivo}</span>
                  </div>
                  <div className="text-xs" style={{ color: PALETTE.text.primary }}>
                    {entry.fecha_ingreso}{entry.fecha_egreso ? ` → ${entry.fecha_egreso}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Clinical summary */}
          <div className="rounded-lg p-5" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: PALETTE.text.primary }}>
              Resumen Clínico
            </h3>
            <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
              <span className="text-xs" style={{ color: PALETTE.text.secondary }}>Total Registros</span>
              <span className="text-2xl font-bold tabular-nums" style={{ color: PALETTE.primary.green }}>{medications.length + treatmentReports.length + diagnosticos.length}</span>
            </div>
            <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
              <span className="text-xs" style={{ color: PALETTE.text.secondary }}>Veces en Vetlist</span>
              <span className="text-lg font-bold tabular-nums" style={{ color: '#d97706' }}>{vetlist.length}</span>
            </div>
            <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
              <span className="text-xs" style={{ color: PALETTE.text.secondary }}>Veces Referido</span>
              <span className="text-lg font-bold tabular-nums" style={{ color: '#dc2626' }}>{referidos.length}</span>
            </div>
            {medications[0] && (
              <>
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                  <span className="text-xs" style={{ color: PALETTE.text.secondary }}>Último</span>
                  <span className="text-xs font-semibold" style={{ color: PALETTE.text.primary }}>{medications[0].administered_at}</span>
                </div>
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                  <span className="text-xs" style={{ color: PALETTE.text.secondary }}>Veterinario</span>
                  <span className="text-xs text-right max-w-32 font-semibold" style={{ color: PALETTE.text.primary }}>{medications[0].vet_name}</span>
                </div>
              </>
            )}
            {vaccinations.length > 0 && (() => {
              const lastVaccination = vaccinations[0]
              const nextVaccinationDate = new Date(new Date(lastVaccination.fecha).getTime() + 365 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0]
              return (
                <div className="flex justify-between py-2">
                  <span className="text-xs" style={{ color: PALETTE.text.secondary }}>Próx. Vacuna</span>
                  <span className="text-xs font-semibold" style={{ color: PALETTE.text.primary }}>{nextVaccinationDate}</span>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-lg p-6" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold" style={{ color: PALETTE.text.dark }}>Historial Médico</h2>
            <div className="flex gap-1">
              {[['desc', 'Más reciente'], ['asc', 'Más antiguo']].map(([val, label]) => (
                <Link key={val} href={`?sort=${val}`}
                  className="px-3 py-1 text-xs rounded-md font-medium transition-colors"
                  style={sort === val
                    ? { background: `${PALETTE.primary.green}20`, color: PALETTE.primary.green, border: `1px solid ${PALETTE.primary.green}60` }
                    : { color: PALETTE.text.secondary, border: `1px solid ${PALETTE.ui.border}` }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {medications.length === 0 && treatmentReports.length === 0 && pmfReports.length === 0 && diagnosticos.length === 0 && vaccinations.length === 0 ? (
            <div className="text-center py-14">
              <div className="text-base font-semibold mb-1" style={{ color: PALETTE.text.primary }}>Sin registros médicos</div>
              <div className="text-sm" style={{ color: PALETTE.text.primary }}>Este caballo no tiene medicamentos ni informes de tratamiento registrados aún.</div>
            </div>
          ) : (
            <div className="relative pl-9">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5"
                style={{ background: `linear-gradient(to bottom, ${PALETTE.primary.green} 0%, ${PALETTE.primary.green}30 100%)` }} />

              {(() => {
                // Combine medications, treatment reports, PMF records, diagnosticos, and vaccinations
                const combinedRecords = [
                  ...medications.map((m: any) => ({ ...m, recordType: 'medication' })),
                  ...treatmentReports.map((t: any) => ({ ...t, recordType: 'treatmentReport' })),
                  ...pmfReports.map((p: any) => ({ ...p, recordType: 'pmfReport' })),
                  ...diagnosticos.map((d: any) => ({ ...d, recordType: 'diagnostico' })),
                  ...vaccinations.map((v: any) => ({ ...v, recordType: 'vaccination' }))
                ].sort((a: any, b: any) => {
                  let dateA: number
                  let dateB: number

                  if (a.recordType === 'medication') dateA = new Date(a.administered_at).getTime()
                  else if (a.recordType === 'treatmentReport' || a.recordType === 'pmfReport') dateA = new Date(a.fecha_tratamiento).getTime()
                  else dateA = new Date(a.fecha).getTime()

                  if (b.recordType === 'medication') dateB = new Date(b.administered_at).getTime()
                  else if (b.recordType === 'treatmentReport' || b.recordType === 'pmfReport') dateB = new Date(b.fecha_tratamiento).getTime()
                  else dateB = new Date(b.fecha).getTime()

                  return dateB - dateA // Most recent first
                })

                return combinedRecords.map((item: any, i: number) => {
                  if (item.recordType === 'medication') {
                    const m = item
                    const color = TYPE_COLORS[m.type] ?? 'PALETTE.primary.green'
                    const [rfg, rbg] = m.tipo_restriccion ? (RESTRICTION_STYLE[m.tipo_restriccion] ?? ['#9ca3af', '#1e2235']) : ['#9ca3af', '#1e2235']
                    return (
                      <div key={`med-${m.id}`} className={`relative ${i < combinedRecords.length - 1 ? 'mb-5' : ''}`}>
                        {/* Animated Capsule Dot */}
                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex-shrink-0">
                          <AnimatedCapsuleDot />
                        </div>

                    <div className="rounded-lg p-4"
                      style={{ background: '#F1F5F9', border: `1px solid ${PALETTE.ui.border}`, borderLeft: `3px solid ${color}` }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold" style={{ color: PALETTE.primary.green }}>{m.drug}</span>
                            {m.type && (
                              <Badge className="text-xs" style={{ background: 'PALETTE.text.secondary22', color: PALETTE.text.primary, border: 'none' }}>
                                {m.type}
                              </Badge>
                            )}
                            {m.proposito && (
                              <Badge className="text-xs" style={{ background: '#34d39922', color: '#34d399', border: 'none' }}>
                                {m.proposito}
                              </Badge>
                            )}
                            {m.tipo_restriccion && (
                              <Badge className="text-xs" style={{ background: rbg, color: rfg, border: 'none' }}>
                                {m.tipo_restriccion}
                              </Badge>
                            )}
                            {m.detection_time_horas && (
                              <span className="text-xs font-semibold" style={{ color: '#f97316' }}>
                                Detección: {m.detection_time_horas}h
                              </span>
                            )}
                            {m.withdrawal_time_horas && (
                              <span className="text-xs font-semibold" style={{ color: '#f97316' }}>
                                Restr.: {m.withdrawal_time_horas}h
                              </span>
                            )}
                          </div>
                          <div className="text-xs" style={{ color: PALETTE.text.primary }}>
                            {m.vet_name}{m.drug_categoria ? ` · ${m.drug_categoria}` : ''}{licenseMap[m.vet_name] ? ` · Lic. ${licenseMap[m.vet_name]}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs whitespace-nowrap" style={{ color: PALETTE.text.primary }}>
                            {m.administered_at}
                          </span>
                          {userIsAdmin && (
                            <ConfirmDeleteButton
                              action={deleteMedication.bind(null, horse.id, m.id)}
                              message="¿Eliminar este registro?"
                              className="p-1 rounded transition-colors hover:text-red-400"
                              style={{ color: PALETTE.text.primary, background: 'none', border: 'none', cursor: 'pointer' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </ConfirmDeleteButton>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-5 flex-wrap">
                        <div>
                          <div className="text-xs uppercase tracking-wider mb-0.5 font-semibold" style={{ color: PALETTE.text.primary }}>Dosis</div>
                          <div className="text-sm font-mono" style={{ color: PALETTE.text.secondary }}>{m.dose}</div>
                        </div>
                        {m.quantity && (
                          <div>
                            <div className="text-xs uppercase tracking-wider mb-0.5 font-semibold" style={{ color: PALETTE.text.primary }}>Cantidad</div>
                            <div className="text-sm" style={{ color: PALETTE.text.secondary }}>{m.quantity}</div>
                          </div>
                        )}
                        {m.notes && (
                          <div className="flex-1 min-w-0">
                            <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: PALETTE.text.primary }}>Notas</div>
                            <div className="text-sm" style={{ color: '#9ca3af' }}>{m.notes}</div>
                          </div>
                        )}
                        {m.drug_notas && (
                          <div className="flex-1 min-w-36">
                            <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: '#f97316' }}>Regulatorio</div>
                            <div className="text-xs leading-relaxed italic" style={{ color: '#9ca3af' }}>{m.drug_notas}</div>
                          </div>
                        )}
                      </div>

                      {m.attachment_url && (
                        <div className="mt-3">
                          <a href={m.attachment_url} target="_blank"
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors"
                            style={{ color: 'PALETTE.primary.green', background: 'PALETTE.primary.green10', border: '1px solid PALETTE.primary.green30' }}>
                            📄 {m.attachment_url.endsWith('.pdf') ? 'Ver PDF' : 'Ver imagen'}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                    )
                  } else if (item.recordType === 'treatmentReport' || item.recordType === 'pmfReport') {
                    // Treatment Report or PMF Record
                    const t = item
                    const estadoColorMap: Record<string, [string, string]> = {
                      borrador: ['#9ca3af', '#f3f4f6'],
                      sometido: ['#f59e0b', '#fffbeb'],
                      radicado: ['#10b981', '#ecfdf5'],
                    }
                    const [textColor, bgColor] = estadoColorMap[t.estado] || ['#9ca3af', '#f3f4f6']
                    const color = item.recordType === 'pmfReport' ? '#ec4899' : '#06b6d4'
                    const isTreatmentReport = item.recordType === 'treatmentReport'
                    const artLabel = item.recordType === 'pmfReport' ? 'Art. 1412' : null
                    const reportCodes = isTreatmentReport ? reportItemCodesMap[t.id] || [] : []
                    const reportHref = isTreatmentReport ? `/treatment-reports/${t.id}` : undefined

                    return (
                      <div key={`report-${t.id}`} className={`relative ${i < combinedRecords.length - 1 ? 'mb-5' : ''}`}>
                        {/* Animated Capsule Dot */}
                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex-shrink-0">
                          <AnimatedCapsuleDot />
                        </div>

                        {reportHref ? (
                          <Link href={reportHref} className="block transition-colors hover:opacity-80">
                            <div
                              className="flex items-start gap-4 p-4 rounded-lg border"
                              style={{ background: '#F1F5F9', borderColor: PALETTE.ui.border, borderLeftColor: color, borderLeftWidth: '3px', borderLeftStyle: 'solid' }}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-sm font-semibold" style={{ color: PALETTE.primary.green }}>
                                {t.drug?.nombre || 'Medicamento'}
                              </span>
                              {t.drug?.tipo_restriccion && (
                                <Badge className="text-xs" style={{ background: '#fef3c722', color: '#92400e', border: 'none' }}>
                                  {t.drug.tipo_restriccion}
                                </Badge>
                              )}
                              {artLabel && (
                                <span className="text-xs" style={{ color: PALETTE.text.secondary }}>{artLabel}</span>
                              )}
                            </div>
                            <div className="text-xs mb-2" style={{ color: PALETTE.text.primary }}>
                              <span className="font-semibold">{t.dosis} {t.dosis_unidad}</span> · {t.vet_autorizado_nombre}{licenseMap[t.vet_autorizado_nombre] ? ` · Lic. ${licenseMap[t.vet_autorizado_nombre]}` : ''}{t.profiles?.license_number ? ` · Lic. ${t.profiles.license_number}` : ''}
                            </div>
                            <div className="text-xs mb-2" style={{ color: PALETTE.text.secondary }}>
                              <span className="font-medium" style={{ color: PALETTE.text.primary }}>Dx:</span> {t.diagnostico.substring(0, 80)}
                              {t.diagnostico.length > 80 ? '...' : ''}
                            </div>
                            {reportCodes.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap mb-2">
                                {reportCodes.map((codeName: string) => {
                                  const codePart = codeName.split(' — ')[0]
                                  return (
                                    <Badge key={codeName} className="text-xs" style={{ background: '#e0f2fe', color: '#0c4a6e', border: 'none' }}>
                                      {codePart}
                                    </Badge>
                                  )
                                })}
                              </div>
                            )}
                            {t.tiempo_restriccion && (
                              <div className="text-xs" style={{ color: '#f97316' }}>
                                Restricción: {t.tiempo_restriccion}h {t.fecha_fin_tratamiento && `· Vence: ${t.fecha_fin_tratamiento}`}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-right flex-shrink-0" style={{ color: PALETTE.text.primary }}>
                            <div style={{ fontWeight: '600' }}>{t.fecha_tratamiento}</div>
                          </div>
                            </div>
                          </Link>
                        ) : (
                          <div
                            className="flex items-start gap-4 p-4 rounded-lg border"
                            style={{ background: '#F1F5F9', borderColor: PALETTE.ui.border, borderLeftColor: color, borderLeftWidth: '3px', borderLeftStyle: 'solid' }}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className="text-sm font-semibold" style={{ color: PALETTE.primary.green }}>
                                  {t.drug?.nombre || 'Medicamento'}
                                </span>
                                <Badge className="text-xs" style={{ background: bgColor, color: textColor, border: 'none' }}>
                                  {t.estado.charAt(0).toUpperCase() + t.estado.slice(1)}
                                </Badge>
                                {t.drug?.tipo_restriccion && (
                                  <Badge className="text-xs" style={{ background: '#fef3c722', color: '#92400e', border: 'none' }}>
                                    {t.drug.tipo_restriccion}
                                  </Badge>
                                )}
                                {artLabel && (
                                  <span className="text-xs" style={{ color: PALETTE.text.secondary }}>{artLabel}</span>
                                )}
                              </div>
                              <div className="text-xs mb-2" style={{ color: PALETTE.text.primary }}>
                                <span className="font-semibold">{t.dosis} {t.dosis_unidad}</span> · {t.vet_autorizado_nombre}{licenseMap[t.vet_autorizado_nombre] ? ` · Lic. ${licenseMap[t.vet_autorizado_nombre]}` : ''}{t.profiles?.license_number ? ` · Lic. ${t.profiles.license_number}` : ''}
                              </div>
                              <div className="text-xs mb-2" style={{ color: PALETTE.text.secondary }}>
                                <span className="font-medium" style={{ color: PALETTE.text.primary }}>Dx:</span> {t.diagnostico.substring(0, 80)}
                                {t.diagnostico.length > 80 ? '...' : ''}
                              </div>
                              {reportCodes.length > 0 && (
                                <div className="flex gap-1.5 flex-wrap mb-2">
                                  {reportCodes.map((codeName: string) => {
                                    const codePart = codeName.split(' — ')[0]
                                    return (
                                      <Badge key={codeName} className="text-xs" style={{ background: '#e0f2fe', color: '#0c4a6e', border: 'none' }}>
                                        {codePart}
                                      </Badge>
                                    )
                                  })}
                                </div>
                              )}
                              {t.tiempo_restriccion && (
                                <div className="text-xs" style={{ color: '#f97316' }}>
                                  Restricción: {t.tiempo_restriccion}h {t.fecha_fin_tratamiento && `· Vence: ${t.fecha_fin_tratamiento}`}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-right flex-shrink-0" style={{ color: PALETTE.text.primary }}>
                              <div style={{ fontWeight: '600' }}>{t.fecha_tratamiento}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  } else if (item.recordType === 'vaccination') {
                    // Vaccination
                    const v = item
                    const color = '#1f9d6b'
                    const nextVaccinationDate = new Date(new Date(v.fecha).getTime() + 365 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split('T')[0]

                    return (
                      <div key={`vac-${v.id}`} className={`relative ${i < combinedRecords.length - 1 ? 'mb-5' : ''}`}>
                        {/* Animated Vaccination Dot */}
                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex-shrink-0">
                          <AnimatedVaccinationDot />
                        </div>

                        <div
                          className="flex items-start gap-4 p-4 rounded-lg border"
                          style={{ background: '#F1F5F9', borderColor: PALETTE.ui.border, borderLeftColor: color, borderLeftWidth: '3px', borderLeftStyle: 'solid' }}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-sm font-semibold" style={{ color }}>Vacunación</span>
                            </div>
                            <div className="text-xs mb-1" style={{ color: PALETTE.text.primary }}>
                              <span className="font-medium">{v.vet_name}{licenseMap[v.vet_name] ? ` · Lic. ${licenseMap[v.vet_name]}` : ''}</span>{v.profiles?.license_number ? <span> · Lic. {v.profiles.license_number}</span> : ''}
                              {v.notas && <span> · {v.notas}</span>}
                            </div>
                            <div className="text-xs" style={{ color: PALETTE.text.secondary }}>
                              Próxima: {nextVaccinationDate}
                            </div>
                          </div>
                          <div className="text-xs text-right flex-shrink-0" style={{ color: PALETTE.text.primary }}>
                            {v.fecha}
                          </div>
                        </div>
                      </div>
                    )
                  } else {
                    // Diagnostico
                    const d = item
                    const color = '#8b5cf6'

                    return (
                      <div key={`diag-${d.id}`} className={`relative ${i < combinedRecords.length - 1 ? 'mb-5' : ''}`}>
                        {/* Animated Diagnostico Dot */}
                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex-shrink-0">
                          <AnimatedDiagnosticoDot />
                        </div>

                        <div
                          className="flex items-start gap-4 p-4 rounded-lg border"
                          style={{ background: '#F1F5F9', borderColor: PALETTE.ui.border, borderLeftColor: color, borderLeftWidth: '3px', borderLeftStyle: 'solid' }}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-sm font-semibold" style={{ color: color }}>
                                {d.diagnostico}
                              </span>
                              {d.severidad && (
                                <Badge className="text-xs" style={{ background: '#7c3aed22', color: '#c084fc', border: 'none' }}>
                                  {d.severidad}
                                </Badge>
                              )}
                              {d.recomendar_vetlist && (
                                <Badge className="text-xs" style={{ background: '#f8717122', color: '#f87171', border: 'none' }}>
                                  Recomendado
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs" style={{ color: PALETTE.text.primary }}>
                              <span className="font-medium">{d.vet_name}</span>{d.profiles?.license_number ? <span> · Lic. {d.profiles.license_number}</span> : ''}
                            </div>
                          </div>
                          <div className="text-xs text-right flex-shrink-0" style={{ color: PALETTE.text.primary }}>
                            {d.fecha}
                          </div>
                        </div>
                      </div>
                    )
                  }
                })
              })()}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
