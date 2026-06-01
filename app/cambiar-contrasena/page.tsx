'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('No pudimos cambiar tu contraseña. Intenta de nuevo.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-1">Nueva contraseña</h2>
        <p className="text-sm mb-7" style={{ color: '#4a5280' }}>
          Ingresa una nueva contraseña para tu cuenta.
        </p>

        {success ? (
          <div className="rounded-lg px-4 py-5 text-center"
            style={{ background: '#0d2e1a', border: '1px solid #4ade8040' }}>
            <div className="text-base font-semibold mb-1" style={{ color: '#4ade80' }}>
              ¡Contraseña actualizada!
            </div>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              Redirigiendo al dashboard...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 rounded-lg px-4 py-3 text-sm"
                style={{ background: '#2e0d0d', border: '1px solid #7f1d1d', color: '#f87171' }}>
                {error}
              </div>
            )}

            {!ready ? (
              <div className="rounded-lg px-4 py-3 text-sm"
                style={{ background: '#1e3a5f', border: '1px solid #3b82f640', color: '#93c5fd' }}>
                Validando el link de reset... Si el link expiró, vuelve a solicitar un reset.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#6b7399' }}>
                    Nueva contraseña
                  </Label>
                  <Input
                    id="password" type="password" required
                    placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirm" className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#6b7399' }}>
                    Confirmar contraseña
                  </Label>
                  <Input
                    id="passwordConfirm" type="password" required
                    placeholder="••••••••"
                    value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full font-semibold" disabled={loading}
                  style={{ background: '#2B55F4' }}>
                  {loading ? 'Actualizando...' : 'Cambiar contraseña'}
                </Button>
              </form>
            )}
          </>
        )}

        <div className="mt-8 pt-6 text-center text-xs" style={{ borderTop: '1px solid #252d4a', color: '#252d4a' }}>
          VetTrack © 2026 — Sistema interno Hipódromo Camarero
        </div>
      </div>
    </div>
  )
}
