'use client'

import { type ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/lib/supabase/user'

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <rect x="2" y="15" width="4" height="6" rx="1" />
      <rect x="9" y="9" width="4" height="12" rx="1" />
      <rect x="16" y="4" width="4" height="17" rx="1" />
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <path d="M12 2c0 6-6 8-6 14a6 6 0 0012 0c0-6-6-8-6-14z" />
      <path d="M12 12c0 3-2 4-2 6a2 2 0 004 0c0-2-2-3-2-6z" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

function BookOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  )
}

function ShoppingBagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </svg>
  )
}

interface NavItem {
  href: string
  label: string
  Icon: ComponentType
  exact?: boolean
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  Admin: [
    { href: '/admin/insumos', label: 'Insumos', Icon: TagIcon },
    { href: '/admin/productos', label: 'Productos', Icon: PackageIcon },
    { href: '/admin/gastos', label: 'Gastos', Icon: ReceiptIcon },
    { href: '/admin/costos', label: 'Costos', Icon: BarChartIcon },
  ],
  panadero: [
    { href: '/panadero', label: 'Producción', Icon: FlameIcon, exact: true },
    { href: '/panadero/recetas', label: 'Recetas', Icon: BookOpenIcon },
    { href: '/panadero/insumos', label: 'Insumos', Icon: TagIcon },
  ],
  vendedor: [
    { href: '/vendedor', label: 'Ventas', Icon: ShoppingBagIcon },
  ],
  planificacion: [
    { href: '/planificacion', label: 'Inicio', Icon: HomeIcon, exact: true },
    { href: '/planificacion/costos', label: 'Costos', Icon: BarChartIcon },
  ],
}

function isActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const items = NAV_ITEMS[role] ?? []

  if (items.length === 0) return null

  return (
    <nav
      className="shrink-0 bg-white px-2 pt-1.5"
      style={{
        borderTop: '1px solid var(--border-subtle)',
        boxShadow: '0 -1px 4px rgba(0,0,0,0.04)',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex max-w-2xl mx-auto gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.exact)
          const { Icon } = item
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl text-xs font-semibold transition-all duration-150"
              style={
                active
                  ? { background: 'var(--brand-light)', color: 'var(--brand-dark)' }
                  : { color: 'var(--ink-faint)' }
              }
            >
              <span
                className="transition-transform duration-150"
                style={{ transform: active ? 'scale(1.08)' : 'scale(1)' }}
              >
                <Icon />
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
