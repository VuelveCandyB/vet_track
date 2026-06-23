import { requireUser, canRegisterEuthanasia, isAdmin, isOfficialVet } from '@/lib/auth'
import ConfirmDeleteButton from '@/components/admin/confirm-delete-button'
import { createClient } from '@/lib/supabase/server'
import { deleteMedication } from '@/lib/actions/medications'
import HorseActions from '@/components/horses/horse-actions'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Horse, Medication, VetlistEntry, EuthanasiaRecord, Drug, Diagnostico, TreatmentReport } from '@/lib/types'
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
    drugsRes, diagRes, treatmentReportsRes, vetName,
    canEuth, officialVet,
  ] = await Promise.all([
    supabase.from('horses').select('*').eq('id', id).single(),
    supabase.from('medications').select('*').eq('horse_id', id).order('administered_at', { ascending: sort === 'asc' }),
    supabase.from('vetlist').select('*').eq('horse_id', id).order('fecha_ingreso', { ascending: false }),
    supabase.from('euthanasia').select('*').eq('horse_id', id).maybeSingle(),
    supabase.from('drugs').select('*').eq('active', true).order('nombre'),
    supabase.from('diagnosticos').select('*').eq('horse_id', id).order('fecha', { ascending: false }),
    supabase.from('treatment_reports').select('*, drug:drugs(nombre, categoria, tipo_restriccion)').eq('horse_id', id).order('fecha_tratamiento', { ascending: false }).limit(5),
    getVetName(supabase, user),
    canRegisterEuthanasia(user.id, user.email!),
    isOfficialVet(user.id, user.email!),
  ])

  const horse = horseRes.data as Horse
  const medications = (medsRes.data ?? []) as Medication[]
  const vetlist = (vetlistRes.data ?? []) as VetlistEntry[]
  const euthanasiaRecord = euthRes.data as EuthanasiaRecord | null
  const drugs = (drugsRes.data ?? []) as Drug[]
  const diagnosticos = (diagRes.data ?? []) as Diagnostico[]
  const treatmentReports = (treatmentReportsRes.data ?? []) as (TreatmentReport & { drug?: { nombre: string; categoria?: string; tipo_restriccion?: string } })[]

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

          {/* Diagnosis history */}
          {diagnosticos.length > 0 && (
            <div className="rounded-lg p-5" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: PALETTE.text.primary }}>
                Historial Diagnósticos
              </h3>
              {diagnosticos.map(diag => (
                <Link key={diag.id} href={`/horses/${horse.id}/diagnosticos/${diag.id}`}
                  className="block py-2.5 px-2 rounded-lg transition-colors hover:bg-[#05966920]"
                  style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium" style={{ color: 'PALETTE.text.primary' }}>{diag.diagnostico}</span>
                    {diag.severidad && (
                      <Badge className="text-xs" style={{ background: '#7c3aed22', color: '#c084fc', border: 'none' }}>
                        {diag.severidad}
                      </Badge>
                    )}
                    {diag.recomendar_vetlist && (
                      <Badge className="text-xs" style={{ background: '#f8717122', color: '#f87171', border: 'none' }}>
                        Recomendado
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: PALETTE.text.primary }}>
                    {diag.fecha} · {diag.vet_name}
                  </div>
                </Link>
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
              <span className="text-2xl font-bold tabular-nums" style={{ color: PALETTE.primary.green }}>{medications.length}</span>
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

          {medications.length === 0 ? (
            <div className="text-center py-14">
              <div className="text-base font-semibold mb-1" style={{ color: PALETTE.text.primary }}>Sin registros médicos</div>
              <div className="text-sm" style={{ color: PALETTE.text.primary }}>Este caballo no tiene medicamentos registrados aún.</div>
            </div>
          ) : (
            <div className="relative pl-9">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5"
                style={{ background: `linear-gradient(to bottom, ${PALETTE.primary.green} 0%, ${PALETTE.primary.green}30 100%)` }} />

              {medications.map((m, i) => {
                const color = TYPE_COLORS[m.type] ?? 'PALETTE.primary.green'
                const [rfg, rbg] = m.tipo_restriccion ? (RESTRICTION_STYLE[m.tipo_restriccion] ?? ['#9ca3af', '#1e2235']) : ['#9ca3af', '#1e2235']
                return (
                  <div key={m.id} className={`relative ${i < medications.length - 1 ? 'mb-5' : ''}`}>
                    {/* Dot */}
                    <div className="absolute -left-6 top-3.5 w-4 h-4 rounded-full border-2 flex-shrink-0"
                      style={{ background: `${color}20`, borderColor: color }} />

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
                            {m.withdrawal_time_horas && (
                              <span className="text-xs font-semibold" style={{ color: '#f97316' }}>
                                Tiempo restr.: {m.withdrawal_time_horas}h
                              </span>
                            )}
                          </div>
                          <div className="text-xs" style={{ color: PALETTE.text.primary }}>
                            {m.vet_name}{m.drug_categoria ? ` · ${m.drug_categoria}` : ''}
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
              })}
            </div>
          )}
        </div>

        {/* Treatment Reports Section (Art. 811) */}
        <div className="rounded-lg p-6 mt-5" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold" style={{ color: PALETTE.text.dark }}>Informes de Tratamiento (Art. 811)</h2>
              <p className="text-xs mt-1" style={{ color: PALETTE.text.secondary }}>Reglamento 8760 de Medicación Controlada</p>
            </div>
            {treatmentReports.length > 0 && (
              <Link href={`/treatment-reports?horse_id=${horse.id}`}
                className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
                style={{ color: PALETTE.primary.green, border: `1px solid ${PALETTE.primary.green}40` }}>
                Ver todos →
              </Link>
            )}
          </div>

          {treatmentReports.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-sm" style={{ color: PALETTE.text.primary }}>Sin informes de tratamiento registrados</div>
            </div>
          ) : (
            <div className="space-y-3">
              {treatmentReports.map(report => {
                const estadoColorMap: Record<string, [string, string]> = {
                  borrador: ['#9ca3af', '#f3f4f6'],
                  sometido: ['#f59e0b', '#fffbeb'],
                  radicado: ['#10b981', '#ecfdf5'],
                }
                const [textColor, bgColor] = estadoColorMap[report.estado] || ['#9ca3af', '#f3f4f6']
                return (
                  <Link key={report.id} href={`/treatment-reports/${report.id}`}
                    className="flex items-center gap-4 p-4 rounded-lg transition-colors border hover:bg-[#f1f5f920]"
                    style={{ background: PALETTE.background.lightAlt, borderColor: PALETTE.ui.border, cursor: 'pointer' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: PALETTE.text.primary }}>
                          {report.drug?.nombre || 'Medicamento'}
                        </span>
                        <Badge className="text-xs" style={{ background: bgColor, color: textColor, border: 'none' }}>
                          {report.estado.charAt(0).toUpperCase() + report.estado.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-xs" style={{ color: PALETTE.text.secondary }}>
                        {report.dosis} {report.dosis_unidad} · {report.fecha_tratamiento} · {report.diagnostico.substring(0, 50)}...
                      </div>
                    </div>
                    <div className="text-xs text-right flex-shrink-0" style={{ color: PALETTE.text.secondary }}>
                      {report.fecha_tratamiento}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
