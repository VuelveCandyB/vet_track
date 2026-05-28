'use client'
import { useState, useTransition, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createDrug, updateDrug, deleteDrug } from '@/lib/actions/admin'
import type { Drug } from '@/lib/types'

const DRUG_CATEGORIES = [
  'Analgésico opioide','Anestésico local','Antifibrinolítico','Antiinflamatorio tópico',
  'Antiulceroso','Broncodilatador','Corticosteroide','Expectorante/Relajante muscular',
  'Intra-articular','NSAID','Relajante muscular','Sedante','Sedante/Tranquilizante',
]
const TIPOS_RESTRICCION = ['WDT', 'RAT', 'RAT+WDT', 'Stand Down']
const RESTRICTION_STYLE: Record<string, [string, string]> = {
  'WDT':        ['#93c5fd', '#1e3a5f'],
  'RAT':        ['#86efac', '#1a2e1a'],
  'RAT+WDT':    ['#fcd34d', '#2d1f00'],
  'Stand Down': ['#fca5a5', '#2d0a0a'],
}

export default function DrugManager({ drugs }: { drugs: Drug[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Drug | null>(null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function openNew() { setEditing(null); setOpen(true) }
  function openEdit(drug: Drug) { setEditing(drug); setOpen(true) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData(formRef.current!)
    startTransition(async () => {
      if (editing) await updateDrug(editing.id, formData)
      else await createDrug(formData)
      setOpen(false)
    })
  }

  function handleDelete(drug: Drug) {
    if (!confirm(`¿Eliminar "${drug.nombre}"? Esta acción no se puede deshacer.`)) return
    startTransition(async () => { await deleteDrug(drug.id) })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: '#4a5280' }}>{drugs.length} medicamentos registrados</p>
        <Button onClick={openNew} style={{ background: '#C8F135', color: '#0d1020' }} className="font-bold">
          + Agregar
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#131829', border: '1px solid #252d4a' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid #252d4a' }}>
                {['Medicamento', 'Categoría', 'Dosis / Ruta', 'Retiro', 'Restricción', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#4a5280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drugs.map(d => {
                const [fg, bg] = d.tipo_restriccion ? (RESTRICTION_STYLE[d.tipo_restriccion] ?? ['#9ca3af', '#1e2235']) : ['#9ca3af', '#1e2235']
                return (
                  <tr key={d.id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid #1e2235' }}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{d.nombre}</div>
                      {d.nombre_comercial && <div className="text-xs mt-0.5" style={{ color: '#4a5280' }}>{d.nombre_comercial}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#cbd5e1' }}>{d.categoria}</td>
                    <td className="px-4 py-3 text-xs max-w-48 overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: '#94a3b8' }}>
                      {d.dosis_ruta || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.withdrawal_time_horas
                        ? <span className="font-semibold text-white">{d.withdrawal_time_horas}h</span>
                        : <span style={{ color: '#4a5280' }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.tipo_restriccion
                        ? <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                            style={{ color: fg, background: bg }}>{d.tipo_restriccion}</span>
                        : <span style={{ color: '#4a5280' }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(d)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{ border: '1px solid #252d4a', color: '#4a5280', background: 'transparent', cursor: 'pointer' }}
                          onMouseOver={e => (e.currentTarget.style.background = '#252d4a')}
                          onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(d)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{ border: '1px solid #252d4a', color: '#4a5280', background: 'transparent', cursor: 'pointer' }}
                          onMouseOver={e => { e.currentTarget.style.background = '#2d0a0a'; e.currentTarget.style.borderColor = '#7f1d1d60'; e.currentTarget.style.color = '#f87171' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#252d4a'; e.currentTarget.style.color = '#4a5280' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drug Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[520px] max-w-full overflow-y-auto"
          style={{ background: '#131829', border: '1px solid #252d4a' }}>
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white" style={{ fontFamily: 'var(--font-dela)' }}>
              {editing ? 'Editar medicamento' : 'Agregar medicamento'}
            </SheetTitle>
          </SheetHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>Nombre genérico *</Label>
                <Input name="nombre" required defaultValue={editing?.nombre} placeholder="Ej. Fenilbutazona" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>Nombre comercial</Label>
                <Input name="nombre_comercial" defaultValue={editing?.nombre_comercial ?? ''} placeholder="Ej. Butazolidina" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>Categoría *</Label>
                <select name="categoria" required
                  className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                  style={{ background: '#0d102080', borderColor: '#252d4a', color: '#e2e8f0' }}>
                  <option value="">Seleccionar...</option>
                  {DRUG_CATEGORIES.map(c => (
                    <option key={c} value={c} selected={editing?.categoria === c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>Dosis / Ruta</Label>
                <Input name="dosis_ruta" defaultValue={editing?.dosis_ruta ?? ''} placeholder="Ej. 4.4 mg/kg IV" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>Tiempo retiro (h)</Label>
                <Input type="number" name="withdrawal_time_horas" defaultValue={editing?.withdrawal_time_horas ?? ''} placeholder="72" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>Tiempo detección (h)</Label>
                <Input type="number" name="detection_time_horas" defaultValue={editing?.detection_time_horas ?? ''} placeholder="120" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>Tipo restricción</Label>
                <select name="tipo_restriccion"
                  className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                  style={{ background: '#0d102080', borderColor: '#252d4a', color: '#e2e8f0' }}>
                  <option value="">Sin restricción</option>
                  {TIPOS_RESTRICCION.map(t => (
                    <option key={t} value={t} selected={editing?.tipo_restriccion === t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>Notas regulatorias</Label>
                <Textarea name="notas" rows={3} defaultValue={editing?.notas ?? ''} placeholder="Observaciones, restricciones especiales..." />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={pending} className="flex-1" style={{ background: '#2B55F4' }}>
                {pending ? 'Guardando...' : (editing ? 'Actualizar' : 'Agregar')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
