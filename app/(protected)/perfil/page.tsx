'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PALETTE } from '@/lib/palette'

type Status = 'idle' | 'saving' | 'ok' | 'error'

function StatusMsg({ status, ok, err }: { status: Status; ok: string; err?: string }) {
  if (status === 'ok') return (
    <p className="text-xs mt-2" style={{ color: PALETTE.primary.green }}>{ok}</p>
  )
  if (status === 'error') return (
    <p className="text-xs mt-2" style={{ color: '#f87171' }}>{err ?? 'Ocurrió un error.'}</p>
  )
  return null
}

export default function PerfilPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profileStatus, setProfileStatus] = useState<Status>('idle')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passStatus, setPassStatus] = useState<Status>('idle')
  const [passError, setPassError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()
      if (data) {
        setFirstName(data.first_name ?? '')
        setLastName(data.last_name ?? '')
      }
    }
    load()
  }, [])

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileStatus('saving')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName })
      .eq('id', user.id)
    setProfileStatus(error ? 'error' : 'ok')
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setPassError('')
    if (newPassword.length < 6) {
      setPassError('La contraseña debe tener al menos 6 caracteres.')
      setPassStatus('error')
      return
    }
    if (newPassword !== confirmPassword) {
      setPassError('Las contraseñas no coinciden.')
      setPassStatus('error')
      return
    }
    setPassStatus('saving')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPassError(error.message)
      setPassStatus('error')
    } else {
      setPassStatus('ok')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  const sectionStyle = { background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }
  const labelStyle = { color: PALETTE.text.secondary }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-sans)', color: PALETTE.primary.green }}>
          Mi perfil
        </h1>
        <p className="text-sm mt-1" style={{ color: PALETTE.text.secondary }}>
          Actualiza tu nombre y contraseña
        </p>
      </div>

      {/* Datos personales */}
      <div className="rounded-xl p-6" style={sectionStyle}>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: '#4a5280' }}>
          Datos personales
        </h2>
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={labelStyle}>
              Correo electrónico
            </Label>
            <Input value={email} readOnly style={{ color: PALETTE.text.secondary, cursor: 'default' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={labelStyle}>
                Nombre
              </Label>
              <Input
                value={firstName}
                onChange={e => { setFirstName(e.target.value); setProfileStatus('idle') }}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={labelStyle}>
                Apellido
              </Label>
              <Input
                value={lastName}
                onChange={e => { setLastName(e.target.value); setProfileStatus('idle') }}
                placeholder="García"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={profileStatus === 'saving'} style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              {profileStatus === 'saving' ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            <StatusMsg status={profileStatus} ok="Nombre actualizado." />
          </div>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="rounded-xl p-6" style={sectionStyle}>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: '#4a5280' }}>
          Cambiar contraseña
        </h2>
        <form onSubmit={handlePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={labelStyle}>
              Nueva contraseña
            </Label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setPassStatus('idle') }}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={labelStyle}>
              Confirmar contraseña
            </Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setPassStatus('idle') }}
              placeholder="Repite la contraseña"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={passStatus === 'saving'} style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              {passStatus === 'saving' ? 'Actualizando...' : 'Cambiar contraseña'}
            </Button>
            <StatusMsg status={passStatus} ok="Contraseña actualizada." err={passError} />
          </div>
        </form>
      </div>
    </div>
  )
}
