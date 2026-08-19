import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Diagnostico } from '@/lib/types'
import { PALETTE } from '@/lib/palette'

export default async function DiagnosisDetailPage({
  params,
}: {
  params: Promise<{ id: string; diagId: string }>
}) {
  const user = await requireUser()
  const { id: horseId, diagId } = await params
  const supabase = await createClient()

  const [horseRes, diagRes] = await Promise.all([
    supabase.from('horses').select('id, name').eq('id', horseId).single(),
    supabase.from('diagnosticos').select('*').eq('id', diagId).single(),
  ])

  const horse = horseRes.data as any
  const diagnosis = diagRes.data as Diagnostico

  // Get creator name if it's a technician
  let creatorName: string | null = null
  if (diagnosis?.created_by) {
    const { data: creator } = await supabase.from('profiles').select('first_name, last_name').eq('id', diagnosis.created_by).single()
    if (creator) {
      creatorName = `${creator.first_name ?? ''} ${creator.last_name ?? ''}`.trim()
    }
  }

  if (!diagnosis) {
    return (
      <div className="text-center py-12">
        <p style={{ color: PALETTE.text.secondary }}>Diagnóstico no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        <Link href="/horses" className="transition-colors hover:text-white" style={{ color: PALETTE.text.secondary }}>
          ← Caballos
        </Link>
        <span style={{ color: '#2a2d3e' }}>/</span>
        <Link href={`/horses/${horseId}`} className="transition-colors hover:text-white" style={{ color: PALETTE.text.secondary }}>
          {horse?.name}
        </Link>
        <span style={{ color: '#2a2d3e' }}>/</span>
        <span style={{ color: PALETTE.text.secondary }}>Diagnóstico</span>
      </div>

      {/* Header */}
      <div className="mb-12">
        <div className="mb-6 pb-4" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
          <p className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: PALETTE.text.secondary }}>Caballo</p>
          <h2 className="text-3xl font-bold" style={{ color: PALETTE.primary.green }}>{horse?.name}</h2>
        </div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold mb-2" style={{ color: PALETTE.text.dark }}>{diagnosis.diagnostico}</h1>
            <p style={{ color: PALETTE.text.secondary }}>
            Registrado {creatorName ? `por ${creatorName} ` : ''}· Médico: {diagnosis.vet_name} · {diagnosis.fecha}
          </p>
          </div>
          {diagnosis.recomendar_vetlist && (
            <Badge style={{ background: PALETTE.status.error, color: '#FFFFFF', border: 'none' }} className="text-xs">
              VetList Recomendado
            </Badge>
          )}
        </div>
      </div>

      {/* Grid de campos principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        {/* Left column */}
        <div className="space-y-8">
          {/* Tipo */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: PALETTE.text.secondary }}>
              Tipo de Diagnóstico
            </label>
            <p className="text-base" style={{ color: PALETTE.text.primary }}>
              {diagnosis.tipo}
            </p>
          </div>

          {/* Sistema Afectado */}
          {diagnosis.sistema_afectado && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: PALETTE.text.secondary }}>
                Sistema Afectado
              </label>
              <p className="text-base" style={{ color: PALETTE.text.primary }}>
                {diagnosis.sistema_afectado}
              </p>
            </div>
          )}

          {/* Severidad */}
          {diagnosis.severidad && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: PALETTE.text.secondary }}>
                Severidad
              </label>
              <Badge className="text-xs" style={{ background: '#7c3aed22', color: '#c084fc', border: 'none' }}>
                {diagnosis.severidad}
              </Badge>
            </div>
          )}

          {/* Fecha */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: PALETTE.text.secondary }}>
              Fecha de Registro
            </label>
            <p className="text-base" style={{ color: PALETTE.text.primary }}>
              {diagnosis.fecha}
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Veterinario */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: PALETTE.text.secondary }}>
              Veterinario Registrador
            </label>
            <p className="text-base" style={{ color: PALETTE.text.primary }}>
              {diagnosis.vet_name}
            </p>
          </div>

          {/* Estado de Recomendación */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: PALETTE.text.secondary }}>
              Estado
            </label>
            {diagnosis.recomendar_vetlist ? (
              <Badge className="bg-orange-950 text-orange-400 border-orange-900 text-xs">
                Pendiente de Revisión - VetList
              </Badge>
            ) : (
              <Badge style={{ background: PALETTE.background.lightAlt, color: PALETTE.text.secondary, border: `1px solid ${PALETTE.ui.border}` }} className="text-xs">
                Sin Recomendación
              </Badge>
            )}
          </div>

          {/* Archivo adjunto */}
          {diagnosis.attachment_url && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: PALETTE.text.secondary }}>
                Documento Adjunto
              </label>
              <a href={diagnosis.attachment_url} target="_blank" rel="noopener noreferrer"
                className="text-sm px-3 py-2 rounded-md transition-colors inline-block"
                style={{ color: PALETTE.primary.green, background: PALETTE.background.lightAlt, border: `1px solid ${PALETTE.ui.border}` }}>
                📎 Ver Documento
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Línea divisoria */}
      <div style={{ borderTop: `1px solid ${PALETTE.ui.border}`, marginBottom: '48px' }} />

      {/* Tratamiento y Notas */}
      <div className="space-y-8 mb-12">
        {diagnosis.tratamiento_recomendado && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: PALETTE.text.secondary }}>
              Tratamiento Recomendado
            </label>
            <p className="text-base leading-relaxed" style={{ color: PALETTE.text.primary, maxWidth: '65ch' }}>
              {diagnosis.tratamiento_recomendado}
            </p>
          </div>
        )}

        {diagnosis.notas && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: PALETTE.text.secondary }}>
              Notas Adicionales
            </label>
            <p className="text-base leading-relaxed" style={{ color: PALETTE.text.primary, maxWidth: '65ch' }}>
              {diagnosis.notas}
            </p>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-8" style={{ borderTop: `1px solid ${PALETTE.ui.border}` }}>
        <Link href={`/horses/${horseId}`}
          className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
          Volver al Caballo
        </Link>
      </div>
    </div>
  )
}
