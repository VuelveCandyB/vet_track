import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen flex" style={{ background: '#0d1020' }}>

      {/* Panel izquierdo — marca */}
      <div className="hidden md:flex w-[42%] flex-col items-center justify-center px-12 relative overflow-hidden flex-shrink-0"
        style={{ background: 'linear-gradient(160deg, #1B2A6B 0%, #0d1020 60%)' }}>
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, #2B55F430 0%, transparent 70%)' }} />

        <div className="relative text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal-blanco.svg" alt="Hipódromo Camarero"
            className="h-10 w-auto mx-auto mb-8" style={{ filter: 'brightness(0) invert(1)' }} />
          <h2 className="text-3xl font-bold text-white leading-tight"
            style={{ fontFamily: '"Dela Gothic One", sans-serif' }}>
            Sistema de<br />
            <span style={{ color: '#C8F135' }}>Medicación Equina</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed max-w-xs mx-auto" style={{ color: '#6b7399' }}>
            Registro y seguimiento de medicación para los ejemplares del hipódromo.
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <LoginForm />
      </div>

    </div>
  )
}
