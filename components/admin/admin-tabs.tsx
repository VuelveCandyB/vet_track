'use client'
import Link from 'next/link'
import { PALETTE } from '@/lib/palette'

const TABS = [
  { href: '/admin',       label: 'Catálogos',    key: 'catalog' },
  { href: '/admin/drugs', label: 'Medicamentos', key: 'drugs' },
  { href: '/admin/vaccines', label: 'Vacunas',   key: 'vaccines' },
  { href: '/admin/users', label: 'Usuarios',     key: 'users' },
]

export default function AdminTabs({ active }: { active: string }) {
  return (
    <nav className="flex gap-1 mb-7" style={{ borderBottom: `1px solid ${PALETTE.ui.border}` }}>
      {TABS.map(tab => (
        <Link key={tab.key} href={tab.href}
          className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2"
          style={active === tab.key
            ? { background: PALETTE.background.lightAlt, color: PALETTE.primary.green, borderColor: PALETTE.primary.green }
            : { color: PALETTE.text.secondary, borderColor: 'transparent' }}>
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
