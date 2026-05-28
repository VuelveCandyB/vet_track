'use client'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createUser } from '@/lib/actions/admin'

export default function CreateUserModal() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const formData = new FormData(formRef.current!)
    startTransition(async () => {
      const result = await createUser(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} style={{ background: '#2B55F4' }}>
        + Nuevo Usuario
      </Button>

      <Dialog open={open} onOpenChange={v => { if (!v) { setError(''); setOpen(false) } }}>
        <DialogContent className="max-w-md" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
          <DialogHeader>
            <DialogTitle className="text-white">Crear Usuario</DialogTitle>
            <p className="text-xs" style={{ color: '#4a5280' }}>
              El usuario recibirá acceso inmediato con estas credenciales.
            </p>
          </DialogHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
            {error && (
              <div className="rounded-lg px-3 py-2.5 text-sm"
                style={{ background: '#2e0d0d', border: '1px solid #7f1d1d', color: '#f87171' }}>
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                  Nombre
                </Label>
                <Input name="first_name" placeholder="Juan" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                  Apellido
                </Label>
                <Input name="last_name" placeholder="García" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                  Correo electrónico *
                </Label>
                <Input name="email" type="email" required placeholder="veterinario@camarero.com" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7399' }}>
                  Contraseña temporal *
                </Label>
                <Input name="password" type="password" required placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer"
                  style={{ background: '#13162080', border: '1px solid #2a2d3e' }}>
                  <input type="checkbox" name="euthanasia"
                    className="w-4 h-4 flex-shrink-0" style={{ accentColor: '#818cf8' }} />
                  <div>
                    <div className="text-sm font-medium text-white">Permiso de eutanasia</div>
                    <div className="text-xs mt-0.5" style={{ color: '#4a5280' }}>
                      Permite al usuario registrar eutanasias
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={pending} className="flex-1" style={{ background: '#2B55F4' }}>
                {pending ? 'Creando...' : 'Crear Usuario'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setError(''); setOpen(false) }} disabled={pending}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
