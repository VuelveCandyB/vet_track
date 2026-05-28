'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { ADMIN_EMAIL } from '@/lib/constants'

export default function Navbar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = user.email === ADMIN_EMAIL

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function navClass(href: string) {
    const active = href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href)
    return active
      ? 'px-4 py-1.5 text-sm font-medium text-white rounded-t-md border-b-2'
      : 'px-4 py-1.5 text-sm font-medium rounded-md transition-colors hover:text-white'
  }

  function navStyle(href: string) {
    const active = href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href)
    return active
      ? { background: '#2B55F420', borderColor: '#C8F135', color: '#fff' }
      : { color: '#4a5280' }
  }

  return (
    <header style={{ background: '#0d102098', borderBottom: '1px solid #252d4a', backdropFilter: 'blur(16px)' }}
      className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal-blanco.svg" alt="Hipódromo Camarero"
            className="h-8 w-auto" style={{ filter: 'brightness(0) invert(1)' }} />
        </Link>

        {/* Nav links */}
        <nav className="flex gap-0.5">
          {[
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/horses',    label: 'Caballos' },
            { href: '/reports',   label: 'Reportes' },
            ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
          ].map(({ href, label }) => (
            <Link key={href} href={href} className={navClass(href)} style={navStyle(href)}>
              {label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: '#2B55F4' }}>
            {user.email?.[0].toUpperCase() ?? '?'}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{user.email}</div>
            <div className="text-xs" style={{ color: '#4a5280' }}>Veterinario</div>
          </div>
          <button onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-md border transition-colors hover:text-white"
            style={{ borderColor: '#252d4a', color: '#9ca3af' }}>
            Salir
          </button>
        </div>

      </div>
    </header>
  )
}
