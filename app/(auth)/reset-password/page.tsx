'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PALETTE } from '@/lib/palette'

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
      <h2 className="text-2xl font-bold mb-1" style={{ color: PALETTE.text.dark }}>Recuperar contraseña</h2>
      <p className="text-sm mb-7" style={{ color: PALETTE.text.secondary }}>
        Ingresa tu email y te enviamos un link para crear una nueva contraseña.
      </p>

      {status === 'sent' ? (
        <div className="rounded-lg px-4 py-5 text-center"
          style={{ background: PALETTE.form.successBg, border: `1px solid ${PALETTE.primary.green}` }}>
          <div className="text-base font-semibold mb-1" style={{ color: PALETTE.primary.green }}>
            Revisa tu email
          </div>
          <p className="text-sm" style={{ color: PALETTE.text.secondary }}>
            Te enviamos un link a <strong style={{ color: PALETTE.text.dark }}>{email}</strong>.
            Puede tardar unos minutos.
          </p>
        </div>
      ) : (
        <>
          {status === 'error' && (
            <div className="mb-5 rounded-lg px-4 py-3 text-sm"
              style={{ background: PALETTE.form.errorBg, border: `1px solid ${PALETTE.status.error}`, color: PALETTE.status.error }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: PALETTE.text.secondary }}>
                Correo electrónico
              </Label>
              <Input
                id="email" type="email" required autoFocus
                placeholder="veterinario@camarero.com"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full font-semibold" disabled={status === 'loading'}
              style={{ background: PALETTE.primary.green, color: '#FFFFFF' }}>
              {status === 'loading' ? 'Enviando...' : 'Enviar instrucciones'}
            </Button>
          </form>
        </>
      )}

      <div className="mt-6 text-center">
        <Link href="/login" className="text-xs transition-colors"
          style={{ color: PALETTE.primary.green }}>
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )
}
