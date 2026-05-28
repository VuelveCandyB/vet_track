'use client'
import Link from 'next/link'

const TABS = [
  { href: '/admin',       label: 'Catálogos',    key: 'catalog' },
  { href: '/admin/drugs', label: 'Medicamentos', key: 'drugs' },
  { href: '/admin/users', label: 'Usuarios',     key: 'users' },
]

export default function AdminTabs({ active }: { active: string }) {
  return (
    <nav className="flex gap-1 mb-7" style={{ borderBottom: '1px solid #252d4a' }}>
      {TABS.map(tab => (
        <Link key={tab.key} href={tab.href}
          className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2"
          style={active === tab.key
            ? { background: '#2B55F420', color: '#fff', borderColor: '#C8F135' }
            : { color: '#4a5280', borderColor: 'transparent' }}>
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
