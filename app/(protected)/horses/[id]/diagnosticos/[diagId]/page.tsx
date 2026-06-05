import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Diagnostico } from '@/lib/types'

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

  if (!diagnosis) {
    return (
      <div className="text-center py-12">
        <p style={{ color: '#4a5280' }}>Diagnóstico no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        <Link href="/horses" className="transition-colors hover:text-white" style={{ color: '#4a5280' }}>
          ← Caballos
        </Link>
        <span style={{ color: '#2a2d3e' }}>/</span>
        <Link href={`/horses/${horseId}`} className="transition-colors hover:text-white" style={{ color: '#4a5280' }}>
          {horse?.name}
        </Link>
        <span style={{ color: '#2a2d3e' }}>/</span>
        <span style={{ color: '#6b7399' }}>Diagnóstico</span>
      </div>

      {/* Header */}
      <div className="mb-12">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">{diagnosis.diagnostico}</h1>
            <p style={{ color: '#6b7399' }}>Registrado por {diagnosis.vet_name} · {diagnosis.fecha}</p>
          </div>
          {diagnosis.recomendar_vetlist && (
            <Badge className="bg-orange-950 text-orange-400 border-orange-900 text-xs">
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
            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: '#4a5280' }}>
              Tipo de Diagnóstico
            </label>
            <p className="text-base" style={{ color: '#c0c8e0' }}>
              {diagnosis.tipo}
            </p>
          </div>

          {/* Sistema Afectado */}
          {diagnosis.sistema_afectado && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: '#4a5280' }}>
                Sistema Afectado
              </label>
              <p className="text-base" style={{ color: '#c0c8e0' }}>
                {diagnosis.sistema_afectado}
              </p>
            </div>
          )}

          {/* Severidad */}
          {diagnosis.severidad && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: '#4a5280' }}>
                Severidad
              </label>
              <Badge className="text-xs" style={{ background: '#7c3aed22', color: '#c084fc', border: 'none' }}>
                {diagnosis.severidad}
              </Badge>
            </div>
          )}

          {/* Fecha */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: '#4a5280' }}>
              Fecha de Registro
            </label>
            <p className="text-base" style={{ color: '#c0c8e0' }}>
              {diagnosis.fecha}
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Veterinario */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: '#4a5280' }}>
              Veterinario Registrador
            </label>
            <p className="text-base" style={{ color: '#c0c8e0' }}>
              {diagnosis.vet_name}
            </p>
          </div>

          {/* Estado de Recomendación */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: '#4a5280' }}>
              Estado
            </label>
            {diagnosis.recomendar_vetlist ? (
              <Badge className="bg-orange-950 text-orange-400 border-orange-900 text-xs">
                Pendiente de Revisión - VetList
              </Badge>
            ) : (
              <Badge className="bg-zinc-900 text-zinc-400 border-zinc-800 text-xs">
                Sin Recomendación
              </Badge>
            )}
          </div>

          {/* Archivo adjunto */}
          {diagnosis.attachment_url && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: '#4a5280' }}>
                Documento Adjunto
              </label>
              <a href={diagnosis.attachment_url} target="_blank" rel="noopener noreferrer"
                className="text-sm px-3 py-2 rounded-md transition-colors inline-block"
                style={{ color: '#818cf8', background: '#818cf810', border: '1px solid #818cf830' }}>
                📎 Ver Documento
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Línea divisoria */}
      <div style={{ borderTop: '1px solid #2a2d3e', marginBottom: '48px' }} />

      {/* Tratamiento y Notas */}
      <div className="space-y-8 mb-12">
        {diagnosis.tratamiento_recomendado && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: '#4a5280' }}>
              Tratamiento Recomendado
            </label>
            <p className="text-base leading-relaxed" style={{ color: '#c0c8e0', maxWidth: '65ch' }}>
              {diagnosis.tratamiento_recomendado}
            </p>
          </div>
        )}

        {diagnosis.notas && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: '#4a5280' }}>
              Notas Adicionales
            </label>
            <p className="text-base leading-relaxed" style={{ color: '#c0c8e0', maxWidth: '65ch' }}>
              {diagnosis.notas}
            </p>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-8" style={{ borderTop: '1px solid #2a2d3e' }}>
        <Link href={`/horses/${horseId}`}
          className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{ background: '#2B55F4', color: '#ffffff' }}>
          Volver al Caballo
        </Link>
      </div>
    </div>
  )
}
