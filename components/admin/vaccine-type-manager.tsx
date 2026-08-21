'use client'
import { useState, useTransition } from 'react'
import { createVaccineType, updateVaccineType, deleteVaccineType } from '@/lib/actions/admin'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ConfirmDeleteButton from './confirm-delete-button'
import { PALETTE } from '@/lib/palette'
import type { VaccineType } from '@/lib/types'

interface Props {
  vaccineTypes: VaccineType[]
}

export default function VaccineTypeManager({ vaccineTypes }: Props) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<VaccineType | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        if (editing) {
          await updateVaccineType(editing.id, formData)
        } else {
          await createVaccineType(formData)
        }
        setOpen(false)
        setEditing(null)
        e.currentTarget.reset()
      } catch (error) {
        console.error('Error saving vaccine type:', error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => {
          setEditing(null)
          setOpen(true)
        }}
        style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}
      >
        + Agregar Vacuna
      </Button>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: PALETTE.text.secondary }}>Nombre</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: PALETTE.text.secondary }}>Validez (días)</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: PALETTE.text.secondary }}>Aviso (días)</th>
              <th className="text-center px-4 py-3 font-semibold" style={{ color: PALETTE.text.secondary }}>Requerida</th>
              <th className="text-center px-4 py-3 font-semibold" style={{ color: PALETTE.text.secondary }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vaccineTypes.map((vt) => (
              <tr key={vt.id} style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
                <td className="px-4 py-3" style={{ color: PALETTE.text.primary }}>{vt.name}</td>
                <td className="px-4 py-3" style={{ color: PALETTE.text.primary }}>{vt.validity_days}</td>
                <td className="px-4 py-3" style={{ color: PALETTE.text.primary }}>{vt.warning_days}</td>
                <td className="px-4 py-3 text-center">
                  {vt.required ? (
                    <span style={{ color: PALETTE.primary.green, fontWeight: 'bold' }}>✓</span>
                  ) : (
                    <span style={{ color: PALETTE.text.secondary }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(vt)
                      setOpen(true)
                    }}
                    style={{ color: PALETTE.primary.green }}
                  >
                    Editar
                  </Button>
                  <ConfirmDeleteButton
                    action={deleteVaccineType.bind(null, vt.id)}
                    message={`¿Eliminar "${vt.name}"?`}
                    className="text-xs transition-colors px-1"
                    style={{ background: 'none', border: 'none', color: PALETTE.text.secondary, cursor: 'pointer' }}>
                    ✕
                  </ConfirmDeleteButton>
                </td>
              </tr>
            ))}
            {vaccineTypes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center" style={{ color: PALETTE.text.secondary }}>
                  Sin tipos de vacunas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: PALETTE.text.dark }}>
              {editing ? 'Editar Vacuna' : 'Agregar Vacuna'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Nombre *
              </Label>
              <Input
                name="name"
                required
                defaultValue={editing?.name ?? ''}
                placeholder="Nombre de la vacuna..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                  Validez (días)
                </Label>
                <Input
                  name="validity_days"
                  type="number"
                  defaultValue={editing?.validity_days ?? 365}
                  placeholder="365"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                  Aviso (días)
                </Label>
                <Input
                  name="warning_days"
                  type="number"
                  defaultValue={editing?.warning_days ?? 30}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                <input
                  type="checkbox"
                  name="required"
                  defaultChecked={editing?.required ?? true}
                  className="mr-2"
                />
                Requerida
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.text.secondary }}>
                Orden
              </Label>
              <Input
                name="sort_order"
                type="number"
                defaultValue={editing?.sort_order ?? 0}
                placeholder="0"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={pending}
                className="flex-1"
                style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}
              >
                {pending ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
