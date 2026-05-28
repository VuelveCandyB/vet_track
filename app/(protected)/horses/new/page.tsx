import { requireUser } from '@/lib/auth'
import { createHorse } from '@/lib/actions/horses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { COLOR_OPTIONS, STATUS_OPTIONS, STATUS_LABEL } from '@/lib/constants'

export default async function NewHorsePage() {
  await requireUser()

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/horses" className="text-sm transition-colors hover:text-white" style={{ color: '#4a5280' }}>
          ← Caballos
        </Link>
      </div>

      <Card style={{ background: '#131829', border: '1px solid #252d4a' }}>
        <CardHeader>
          <CardTitle className="text-white">Nuevo Caballo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createHorse} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label style={{ color: '#6b7399' }}>Nombre *</Label>
                <Input name="name" required placeholder="NOMBRE DEL CABALLO" />
              </div>

              <div className="space-y-1.5">
                <Label style={{ color: '#6b7399' }}>Color *</Label>
                <select name="color" required
                  className="flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors"
                  style={{ background: '#0d102080', borderColor: '#252d4a', color: '#e2e8f0' }}>
                  <option value="" disabled>Seleccionar...</option>
                  {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label style={{ color: '#6b7399' }}>Estado</Label>
                <select name="status"
                  className="flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors"
                  style={{ background: '#0d102080', borderColor: '#252d4a', color: '#e2e8f0' }}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label style={{ color: '#6b7399' }}>Registro</Label>
                <Input name="registration" placeholder="Número de registro" />
              </div>

              <div className="space-y-1.5">
                <Label style={{ color: '#6b7399' }}>Fecha de Nacimiento</Label>
                <Input name="birth_date" type="date" />
              </div>

              <div className="space-y-1.5">
                <Label style={{ color: '#6b7399' }}>Propietario</Label>
                <Input name="owner" placeholder="Nombre del dueño" />
              </div>

              <div className="space-y-1.5">
                <Label style={{ color: '#6b7399' }}>Entrenador</Label>
                <Input name="trainer" placeholder="Nombre del entrenador" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" style={{ background: '#2B55F4' }} className="flex-1">
                Crear Caballo
              </Button>
              <Link href="/horses">
                <Button variant="ghost" type="button">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
