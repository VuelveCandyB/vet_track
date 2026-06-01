import { requireUser, canRegisterEuthanasia, isAdmin } from '@/lib/auth'
import ConfirmDeleteButton from '@/components/admin/confirm-delete-button'
import { createClient } from '@/lib/supabase/server'
import { deleteMedication } from '@/lib/actions/medications'
import HorseActions from '@/components/horses/horse-actions'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Horse, Medication, VetlistEntry, EuthanasiaRecord, Drug } from '@/lib/types'
import { STATUS_LABEL } from '@/lib/constants'

const STATUS_STYLE: Record<string, string> = {
  active:   'bg-green-950 text-green-400 border-green-900',
  rest:     'bg-yellow-950 text-yellow-400 border-yellow-900',
  injury:   'bg-red-950 text-red-400 border-red-900',
  deceased: 'bg-zinc-900 text-zinc-500 border-zinc-800',
}
const COLOR_STYLE: Record<string, string> = {
  'Bay':      'bg-amber-950 text-amber-400 border-amber-900',
  'Dark Bay': 'bg-slate-900 text-slate-400 border-slate-800',
  'Chestnut': 'bg-orange-950 text-orange-400 border-orange-900',
  'Grey':     'bg-blue-950 text-blue-300 border-blue-900',
  'Roan':     'bg-purple-950 text-purple-400 border-purple-900',
  'Black':    'bg-zinc-900 text-zinc-400 border-zinc-800',
}
const TYPE_COLORS: Record<string, string> = {
  'Vacuna': '#4ade80', 'Vaccine': '#4ade80',
  'Anti-inflamatorio': '#f87171',
  'Antiparasitario': '#34d399', 'Desparasitante': '#34d399',
  'Suplemento': '#facc15',
  'Examen': '#38bdf8',
  'Antibiótico': '#818cf8',
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
    drugsRes, vetName,
    canEuth,
  ] = await Promise.all([
    supabase.from('horses').select('*').eq('id', id).single(),
    supabase.from('medications').select('*').eq('horse_id', id).order('administered_at', { ascending: sort === 'asc' }),
    supabase.from('vetlist').select('*').eq('horse_id', id).order('fecha_ingreso', { ascending: false }),
    supabase.from('euthanasia').select('*').eq('horse_id', id).maybeSingle(),
    supabase.from('drugs').select('*').eq('active', true).order('nombre'),
    getVetName(supabase, user),
    canRegisterEuthanasia(user.id, user.email!),
  ])

  const horse = horseRes.data as Horse
  const medications = (medsRes.data ?? []) as Medication[]
  const vetlist = (vetlistRes.data ?? []) as VetlistEntry[]
  const euthanasiaRecord = euthRes.data as EuthanasiaRecord | null
  const drugs = (drugsRes.data ?? []) as Drug[]

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
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Link href="/horses" className="transition-colors hover:text-white" style={{ color: '#4a5280' }}>
          ← Caballos
        </Link>
        <span style={{ color: '#2a2d3e' }}>/</span>
        <span style={{ color: '#6b7399' }}>{horse.name}</span>
      </div>

      {/* Horse header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1e2a5e, #3a1e5e)', color: '#c0c8e0' }}>
          {horse.name.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white mb-1">{horse.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs border ${COLOR_STYLE[horse.color] ?? 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
              {horse.color}
            </Badge>
            <Badge className={`text-xs border ${STATUS_STYLE[horse.status] ?? ''}`}>
              {STATUS_LABEL[horse.status] ?? horse.status}
            </Badge>
            {horse.registration && (
              <span className="text-xs" style={{ color: '#4a5280' }}>Reg. {horse.registration}</span>
            )}
            {horse.microchip && (
              <span className="font-mono text-xs px-1.5 py-0.5 rounded"
                style={{ background: '#1e2235', color: '#818cf8' }}>
                {horse.microchip}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Euthanasia banner */}
      {euthanasiaRecord && (
        <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-4"
          style={{ background: '#0d0d0d', border: '1px solid #374151' }}>
          <div className="text-sm font-bold" style={{ color: '#9ca3af' }}>
            CABALLO FALLECIDO — EUTANASIA REGISTRADA
          </div>
          <div className="text-xs ml-2" style={{ color: '#6b7280' }}>
            {euthanasiaRecord.fecha} · {euthanasiaRecord.vet_name}
          </div>
          {euthanasiaRecord.attachment_url && (
            <a href={euthanasiaRecord.attachment_url} target="_blank"
              className="ml-auto text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#818cf8', background: '#818cf810', border: '1px solid #818cf830' }}>
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
          <div className="rounded-xl p-5" style={{ background: '#131829', border: '1px solid #252d4a' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#4a5280' }}>
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
                style={{ borderBottom: '1px solid #1e2235' }}>
                <span className="text-xs" style={{ color: '#4a5280' }}>{label}</span>
                <span className="text-xs font-medium text-right max-w-36 break-all"
                  style={{ color: label === 'Microchip' && val ? '#818cf8' : '#c0c8e0' }}>
                  {val || '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Vetlist history */}
          {vetlist.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: '#131829', border: '1px solid #252d4a' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#4a5280' }}>
                Historial Vetlist
              </h3>
              {vetlist.map(entry => (
                <div key={entry.id} className="py-2" style={{ borderBottom: '1px solid #1e2235' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs border ${entry.fecha_egreso ? 'bg-green-950 text-green-400 border-green-900' : 'bg-red-950 text-red-400 border-red-900'}`}>
                      {entry.fecha_egreso ? 'Liberado' : 'Activo'}
                    </Badge>
                    <span className="text-xs" style={{ color: '#4a5280' }}>{entry.motivo}</span>
                  </div>
                  <div className="text-xs" style={{ color: '#6b7399' }}>
                    {entry.fecha_ingreso}{entry.fecha_egreso ? ` → ${entry.fecha_egreso}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Clinical summary */}
          <div className="rounded-xl p-5" style={{ background: '#131829', border: '1px solid #252d4a' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#4a5280' }}>
              Resumen Clínico
            </h3>
            <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #1e2235' }}>
              <span className="text-xs" style={{ color: '#4a5280' }}>Total Registros</span>
              <span className="text-2xl font-bold tabular-nums" style={{ color: '#818cf8' }}>{medications.length}</span>
            </div>
            {medications[0] && (
              <>
                <div className="flex justify-between py-2" style={{ borderBottom: '1px solid #1e2235' }}>
                  <span className="text-xs" style={{ color: '#4a5280' }}>Último</span>
                  <span className="text-xs" style={{ color: '#c0c8e0' }}>{medications[0].administered_at}</span>
                </div>
                <div className="flex justify-between py-2" style={{ borderBottom: '1px solid #1e2235' }}>
                  <span className="text-xs" style={{ color: '#4a5280' }}>Veterinario</span>
                  <span className="text-xs text-right max-w-32" style={{ color: '#c0c8e0' }}>{medications[0].vet_name}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl p-6" style={{ background: '#131829', border: '1px solid #252d4a' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white">Historial Médico</h2>
            <div className="flex gap-1">
              {[['desc', 'Más reciente'], ['asc', 'Más antiguo']].map(([val, label]) => (
                <Link key={val} href={`?sort=${val}`}
                  className="px-3 py-1 text-xs rounded-md font-medium transition-colors"
                  style={sort === val
                    ? { background: '#2B55F420', color: '#fff', border: '1px solid #2B55F460' }
                    : { color: '#4a5280', border: '1px solid #2a2d3e' }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {medications.length === 0 ? (
            <div className="text-center py-14">
              <div className="text-base font-semibold mb-1" style={{ color: '#6b7399' }}>Sin registros médicos</div>
              <div className="text-sm" style={{ color: '#4a5280' }}>Este caballo no tiene medicamentos registrados aún.</div>
            </div>
          ) : (
            <div className="relative pl-9">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5"
                style={{ background: 'linear-gradient(to bottom, #3a55e8 0%, #3a55e830 100%)' }} />

              {medications.map((m, i) => {
                const color = TYPE_COLORS[m.type] ?? '#818cf8'
                const [rfg, rbg] = m.tipo_restriccion ? (RESTRICTION_STYLE[m.tipo_restriccion] ?? ['#9ca3af', '#1e2235']) : ['#9ca3af', '#1e2235']
                return (
                  <div key={m.id} className={`relative ${i < medications.length - 1 ? 'mb-5' : ''}`}>
                    {/* Dot */}
                    <div className="absolute -left-6 top-3.5 w-4 h-4 rounded-full border-2 flex-shrink-0"
                      style={{ background: `${color}20`, borderColor: color }} />

                    <div className="rounded-lg p-4"
                      style={{ background: '#13162080', border: `1px solid #2a2d3e`, borderLeft: `3px solid ${color}` }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-white">{m.drug}</span>
                            {m.type && (
                              <Badge className="text-xs" style={{ background: '#4a528022', color: '#6b7399', border: 'none' }}>
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
                                Retiro: {m.withdrawal_time_horas}h
                              </span>
                            )}
                          </div>
                          <div className="text-xs" style={{ color: '#4a5280' }}>
                            {m.vet_name}{m.drug_categoria ? ` · ${m.drug_categoria}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs whitespace-nowrap" style={{ color: '#4a5280' }}>
                            {m.administered_at}
                          </span>
                          {userIsAdmin && (
                            <ConfirmDeleteButton
                              action={deleteMedication.bind(null, horse.id, m.id)}
                              message="¿Eliminar este registro?"
                              className="p-1 rounded transition-colors hover:text-red-400"
                              style={{ color: '#4a5280', background: 'none', border: 'none', cursor: 'pointer' }}>
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
                          <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: '#4a5280' }}>Dosis</div>
                          <div className="text-sm font-mono" style={{ color: '#c0c8e0' }}>{m.dose}</div>
                        </div>
                        {m.quantity && (
                          <div>
                            <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: '#4a5280' }}>Cantidad</div>
                            <div className="text-sm" style={{ color: '#c0c8e0' }}>{m.quantity}</div>
                          </div>
                        )}
                        {m.notes && (
                          <div className="flex-1 min-w-0">
                            <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: '#4a5280' }}>Notas</div>
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
                            style={{ color: '#818cf8', background: '#818cf810', border: '1px solid #818cf830' }}>
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
      </div>
    </div>
  )
}
