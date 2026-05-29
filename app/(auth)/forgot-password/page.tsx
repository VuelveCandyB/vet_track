'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://vet-track-five.vercel.app'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/auth/callback?next=/perfil`,
    })

    if (error) {
      setErrorMsg('No pudimos enviar el correo. Verifica que el email sea correcto.')
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="w-full max-w-sm">

        <h2 className="text-2xl font-bold text-white mb-1">Recuperar contraseña</h2>
        <p className="text-sm mb-7" style={{ color: '#4a5280' }}>
          Ingresa tu email y te enviamos un link para crear una nueva contraseña.
        </p>

        {status === 'sent' ? (
          <div className="rounded-lg px-4 py-5 text-center"
            style={{ background: '#0d2e1a', border: '1px solid #4ade8040' }}>
            <div className="text-base font-semibold mb-1" style={{ color: '#4ade80' }}>
              Revisa tu email
            </div>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              Te enviamos un link a <strong style={{ color: '#e2e8f0' }}>{email}</strong>.
              Puede tardar unos minutos.
            </p>
          </div>
        ) : (
          <>
            {status === 'error' && (
              <div className="mb-5 rounded-lg px-4 py-3 text-sm"
                style={{ background: '#2e0d0d', border: '1px solid #7f1d1d', color: '#f87171' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#6b7399' }}>
                  Correo electrónico
                </Label>
                <Input
                  id="email" type="email" required autoFocus
                  placeholder="veterinario@camarero.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full font-semibold" disabled={status === 'loading'}
                style={{ background: '#2B55F4' }}>
                {status === 'loading' ? 'Enviando...' : 'Enviar instrucciones'}
              </Button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-xs transition-colors hover:text-white"
            style={{ color: '#4a5280' }}>
            Volver al inicio de sesión
          </Link>
        </div>

      </div>
  )
}
