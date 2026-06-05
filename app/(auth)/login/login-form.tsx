'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://vet-track-five.vercel.app'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'recover'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [recoverStatus, setRecoverStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [recoverError, setRecoverError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleRecoverPassword(e: React.FormEvent) {
    e.preventDefault()
    setRecoverStatus('loading')
    setRecoverError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/cambiar-contrasena`,
    })

    if (error) {
      let errorMsg = 'No pudimos enviar el correo. Verifica que el email sea correcto.'
      if (error.message?.includes('rate limit')) {
        errorMsg = 'Por seguridad, espera 1 hora antes de solicitar otro reset. Revisa tu inbox.'
      }
      setRecoverError(errorMsg)
      setRecoverStatus('error')
    } else {
      setRecoverStatus('sent')
    }
  }

  if (mode === 'recover') {
    return (
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold" style={{ color: '#0F172A' }}>Recuperar contraseña</h2>
        <p className="text-sm mb-7" style={{ color: '#64748B' }}>
          Ingresa tu email y te enviamos un link para crear una nueva contraseña.
        </p>

        {recoverStatus === 'sent' ? (
          <div className="rounded-lg px-4 py-5 text-center"
            style={{ background: '#DCFCE7', border: '1px solid #059669' }}>
            <div className="text-base font-semibold mb-1" style={{ color: '#065F46' }}>
              Revisa tu email
            </div>
            <p className="text-sm" style={{ color: '#334155' }}>
              Te enviamos un link a <strong style={{ color: '#0F172A' }}>{email}</strong>.
              Puede tardar unos minutos.
            </p>
          </div>
        ) : (
          <>
            {recoverStatus === 'error' && (
              <div className="mb-5 rounded-lg px-4 py-3 text-sm"
                style={{ background: '#FEE2E2', border: '1px solid #DC2626', color: '#991B1B' }}>
                {recoverError}
              </div>
            )}

            <form onSubmit={handleRecoverPassword} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#64748B' }}>
                  Correo electrónico
                </Label>
                <Input
                  id="email" type="email" required autoFocus
                  placeholder="veterinario@camarero.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full font-semibold" disabled={recoverStatus === 'loading'}
                style={{ background: '#059669' }}>
                {recoverStatus === 'loading' ? 'Enviando...' : 'Enviar instrucciones'}
              </Button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode('login')
              setEmail('')
              setRecoverStatus('idle')
              setRecoverError('')
            }}
            className="text-xs transition-colors hover:font-semibold cursor-pointer"
            style={{ color: '#059669' }}>
            Volver al inicio de sesión
          </button>
        </div>

        <div className="mt-8 pt-6 text-center text-xs" style={{ borderTop: '1px solid #E2E8F0', color: '#CBD5E1' }}>
          PyAgentix © 2026 — Sistema interno Hipódromo Camarero
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-2 flex flex-col items-center w-full">
        <img src="https://res.cloudinary.com/dee0x7p16/image/upload/v1780695288/HC_Logo-Principal_Negro_mfsygj.png" alt="Logo" className="h-10 w-auto mb-4" />
        <h2 className="text-2xl font-bold" style={{ color: '#059669' }}>Iniciar Sesión</h2>
      </div>
      <p className="text-sm mb-7" style={{ color: '#64748B' }}>
        Ingresa tus credenciales para continuar
      </p>

      {error && (
        <div className="mb-5 rounded-lg px-4 py-3 text-sm"
          style={{ background: '#FEE2E2', border: '1px solid #DC2626', color: '#991B1B' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: '#059669' }}>
            Correo Electrónico
          </Label>
          <Input
            id="email" type="email" required autoFocus
            placeholder="veterinario@camarero.com"
            value={email} onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: '#059669' }}>
            Contraseña
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
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: '#64748B' }}
              tabIndex={-1}>
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full font-semibold mt-2" disabled={loading}
          style={{ background: '#059669' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>

        <div className="text-center mt-3">
          <button
            onClick={() => setMode('recover')}
            className="text-xs transition-colors cursor-pointer hover:font-semibold"
            style={{ color: '#059669' }}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 text-center text-xs" style={{ borderTop: '1px solid #E2E8F0', color: '#CBD5E1' }}>
        PyAgentix © 2026 — Sistema interno Hipódromo Camarero
      </div>
    </div>
  )
}
