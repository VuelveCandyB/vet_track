'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { ADMIN_EMAIL } from '@/lib/constants'

export default function Navbar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = user.email === ADMIN_EMAIL
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/horses',    label: 'Caballos' },
    { href: '/reports',   label: 'Reportes' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  function isActive(href: string) {
    return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  }

  return (
    <header style={{ background: '#0d102098', borderBottom: '1px solid #252d4a', backdropFilter: 'blur(16px)' }}
      className="sticky top-0 z-50 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 w-full">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* Mobile: logo stacked */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-stacked-blanco.svg" alt="Hipódromo Camarero"
            className="md:hidden h-10 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }} />
          {/* Desktop: logo horizontal */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal-blanco.svg" alt="Hipódromo Camarero"
            className="hidden md:block h-8 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-0.5">
          {navItems.map(({ href, label }) => (
            <Link key={href} href={href}
              className="px-4 py-1.5 text-sm font-medium rounded-md transition-colors -mb-px border-b-2"
              style={isActive(href)
                ? { background: '#2B55F420', color: '#fff', borderColor: '#C8F135', borderRadius: '6px 6px 0 0' }
                : { color: '#4a5280', borderColor: 'transparent' }}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop user */}
        <div className="hidden md:flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: '#2B55F4' }}>
            {user.email?.[0].toUpperCase() ?? '?'}
          </div>
          <div className="hidden lg:block">
            <div className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{user.email}</div>
            <div className="text-xs" style={{ color: '#4a5280' }}>Veterinario</div>
          </div>
          <button onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-md border transition-colors hover:text-white"
            style={{ borderColor: '#252d4a', color: '#9ca3af' }}>
            Salir
          </button>
        </div>

        {/* Mobile: avatar + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: '#2B55F4' }}>
            {user.email?.[0].toUpperCase() ?? '?'}
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-md transition-colors"
            style={{ color: '#9ca3af' }}
            aria-label="Menú">
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className="md:hidden overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
        style={{
          maxHeight: menuOpen ? '400px' : '0px',
          opacity: menuOpen ? 1 : 0,
          borderTop: menuOpen ? '1px solid #252d4a' : 'none',
        }}
      >
        <div className="px-4 pb-4 space-y-1">
          {navItems.map(({ href, label }) => (
            <Link key={href} href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              style={isActive(href)
                ? { background: '#2B55F420', color: '#fff', borderLeft: '3px solid #C8F135' }
                : { color: '#9ca3af' }}>
              {label}
            </Link>
          ))}
          <div className="pt-2 mt-2" style={{ borderTop: '1px solid #1e2235' }}>
            <div className="px-4 py-2 text-xs" style={{ color: '#4a5280' }}>{user.email}</div>
            <button onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg text-sm transition-colors"
              style={{ color: '#f87171' }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
