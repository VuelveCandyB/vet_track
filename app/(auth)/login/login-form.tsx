'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-bold text-white mb-1">Iniciar Sesión</h2>
      <p className="text-sm mb-7" style={{ color: '#4a5280' }}>
        Ingresa tus credenciales para continuar
      </p>

      {error && (
        <div className="mb-5 rounded-lg px-4 py-3 text-sm"
          style={{ background: '#2e0d0d', border: '1px solid #7f1d1d', color: '#f87171' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: '#6b7399' }}>
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
            style={{ color: '#6b7399' }}>
            Contraseña
          </Label>
          <Input
            id="password" type="password" required
            placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full font-semibold mt-2" disabled={loading}
          style={{ background: '#2B55F4' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>

        <div className="text-center mt-3">
          <Link href="/forgot-password" className="text-xs underline transition-colors hover:text-white"
            style={{ color: '#4a5280' }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </form>

      <div className="mt-8 pt-6 text-center text-xs" style={{ borderTop: '1px solid #252d4a', color: '#252d4a' }}>
        VetTrack © 2026 — Sistema interno Hipódromo Camarero
      </div>
    </div>
  )
}
