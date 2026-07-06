'use client'
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PALETTE } from '@/lib/palette'
import type { Horse, Drug } from '@/lib/types'

interface PMFFormProps {
  horses: Horse[]
  drugs: Drug[]
  vetName: string
  defaultValues?: { horse_id?: string }
  mode: 'create' | 'edit'
  createAction: (formData: FormData) => Promise<string>
  updateAction?: (id: string, formData: FormData) => Promise<void>
  recordId?: string
}

export default function PMFForm({
  horses,
  drugs,
  vetName,
  defaultValues,
  mode,
  createAction,
  updateAction,
  recordId,
}: PMFFormProps) {
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)

    try {
      const formData = new FormData(e.currentTarget)

      if (mode === 'create') {
        const redirectUrl = await createAction(formData)
        if (redirectUrl) {
          window.location.href = redirectUrl
        }
      } else if (mode === 'edit' && recordId && updateAction) {
        await updateAction(recordId, formData)
        alert('PMF actualizado correctamente')
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-5">
      {/* SECCIÓN 1: INFORMACIÓN DEL CABALLO */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0` }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.primary.green }}>
          Art. 1412a - Identificación del Ejemplar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="horse_id" style={{ color: PALETTE.text.primary }}>Caballo *</Label>
            <select
              id="horse_id"
              name="horse_id"
              defaultValue={defaultValues?.horse_id ?? ''}
              required
              disabled={!!defaultValues?.horse_id}
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm mt-1"
              style={{
                borderColor: PALETTE.ui.border,
                backgroundColor: defaultValues?.horse_id ? '#F3F4F6' : '#FFFFFF',
                color: PALETTE.text.primary,
              }}
            >
              <option value="">Seleccionar caballo...</option>
              {horses.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="horse_id_oficial" style={{ color: PALETTE.text.primary }}>ID Oficial del Caballo (Microchip)</Label>
            <Input
              id="horse_id_oficial"
              name="horse_id_oficial"
              placeholder="Ingresa el microchip"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: RECETA (Art. 1407-1408) */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0` }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.primary.green }}>
          Art. 1407-1408 - Receta de Furosemide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="vet_autorizado_nombre" style={{ color: PALETTE.text.primary }}>Veterinario Autorizado</Label>
            <Input
              id="vet_autorizado_nombre"
              name="vet_autorizado_nombre"
              value={vetName}
              readOnly
              className="mt-1"
              style={{ backgroundColor: '#F3F4F6' }}
            />
          </div>

          <div>
            <Label htmlFor="dosis_recetada" style={{ color: PALETTE.text.primary }}>Dosis Recetada (mg) *</Label>
            <Input
              id="dosis_recetada"
              name="dosis_recetada"
              type="number"
              required
              min="100"
              max="500"
              placeholder="200"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="hora_entrega_receta" style={{ color: PALETTE.text.primary }}>Hora Entrega Receta *</Label>
            <Input
              id="hora_entrega_receta"
              name="hora_entrega_receta"
              type="datetime-local"
              required
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: ADMINISTRACIÓN (Art. 1406, 1410, 1412) */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0` }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.primary.green }}>
          Art. 1406, 1410, 1412 - Administración
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fecha_admin" style={{ color: PALETTE.text.primary }}>Fecha Administración *</Label>
            <Input
              id="fecha_admin"
              name="fecha_admin"
              type="date"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="hora_admin" style={{ color: PALETTE.text.primary }}>Hora Administración *</Label>
            <Input
              id="hora_admin"
              name="hora_admin"
              type="time"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="dosis_administrada" style={{ color: PALETTE.text.primary }}>Dosis Administrada (mg) *</Label>
            <Input
              id="dosis_administrada"
              name="dosis_administrada"
              type="number"
              required
              min="100"
              max="500"
              placeholder="200"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="via_admin" style={{ color: PALETTE.text.primary }}>Vía de Administración *</Label>
            <select
              id="via_admin"
              name="via_admin"
              defaultValue="IV"
              required
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm mt-1"
              style={{ borderColor: PALETTE.ui.border, color: PALETTE.text.primary }}
            >
              <option value="IV">IV (Intravenosa)</option>
              <option value="IM">IM (Intramuscular)</option>
              <option value="PO">PO (Oral)</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer" style={{ color: PALETTE.text.primary }}>
              <input
                id="aguja_confirmada"
                name="aguja_confirmada"
                type="checkbox"
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Aguja confirmada</span>
            </label>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: OBSERVACIONES */}
      <div className="p-6 rounded-lg" style={{ background: PALETTE.background.white, border: `1px solid #E2E8F0` }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: PALETTE.text.primary }}>
          Observaciones
        </h3>
        <div>
          <Label htmlFor="observaciones" style={{ color: PALETTE.text.primary }}>Notas Adicionales</Label>
          <textarea
            id="observaciones"
            name="observaciones"
            rows={4}
            placeholder="Detalles adicionales..."
            className="w-full mt-1 p-3 border rounded-md text-sm"
            style={{ borderColor: PALETTE.ui.border, color: PALETTE.text.primary }}
          />
        </div>
      </div>

      {/* BOTONES */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" type="reset">
          Limpiar
        </Button>
        <Button type="submit" disabled={pending} style={{ background: PALETTE.primary.green, color: '#fff' }}>
          {pending ? 'Guardando...' : mode === 'create' ? 'Crear PMF' : 'Actualizar PMF'}
        </Button>
      </div>
    </form>
  )
}
