'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PALETTE } from '@/lib/palette'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Check if there's a recovery code in the URL
    const hash = window.location.hash
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    // If there's a code in the URL, Supabase should process it
    if (code) {
      // The code will be processed by Supabase automatically
      setReady(true)
      return
    }

    // Otherwise, listen for PASSWORD_RECOVERY event
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
      style={{ background: PALETTE.background.light }}>
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-1" style={{ color: PALETTE.text.dark }}>Nueva contraseña</h2>
        <p className="text-sm mb-7" style={{ color: PALETTE.text.secondary }}>
          Ingresa una nueva contraseña para tu cuenta.
        </p>

        {success ? (
          <div className="rounded-lg px-4 py-5 text-center"
            style={{ background: PALETTE.form.successBg, border: `1px solid ${PALETTE.primary.green}` }}>
            <div className="text-base font-semibold mb-1" style={{ color: PALETTE.primary.green }}>
              ¡Contraseña actualizada!
            </div>
            <p className="text-sm" style={{ color: PALETTE.text.secondary }}>
              Redirigiendo al dashboard...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 rounded-lg px-4 py-3 text-sm"
                style={{ background: PALETTE.form.errorBg, border: `1px solid ${PALETTE.status.error}`, color: PALETTE.status.error }}>
                {error}
              </div>
            )}

            {!ready ? (
              <div className="rounded-lg px-4 py-3 text-sm"
                style={{ background: PALETTE.background.lightAlt, border: `1px solid ${PALETTE.ui.border}`, color: PALETTE.text.secondary }}>
                Validando el link de reset... Si el link expiró, vuelve a solicitar un reset.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: PALETTE.text.secondary }}>
                    Nueva contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password" type={showPassword ? 'text' : 'password'} required
                      placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                      style={{ color: PALETTE.text.secondary }}
                      tabIndex={-1}>
                      {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirm" className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: PALETTE.text.secondary }}>
                    Confirmar contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="passwordConfirm" type={showPasswordConfirm ? 'text' : 'password'} required
                      placeholder="••••••••"
                      value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                      style={{ color: PALETTE.text.secondary }}
                      tabIndex={-1}>
                      {showPasswordConfirm ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full font-semibold" disabled={loading}
                  style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
                  {loading ? 'Actualizando...' : 'Cambiar contraseña'}
                </Button>
              </form>
            )}
          </>
        )}

        <div className="mt-8 pt-6 text-center text-xs" style={{ borderTop: `1px solid ${PALETTE.ui.border}`, color: PALETTE.text.secondary }}>
          VetTrack © 2026 — Sistema interno Hipódromo Camarero
        </div>
      </div>
    </div>
  )
}
