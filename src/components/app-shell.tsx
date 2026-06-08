import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CurrentUser, UserRole } from '@/lib/supabase/user'
import BottomNav from './nav'
import SwipeNavigation from './swipe-navigation'

const DASHBOARD_PATH: Record<UserRole, string> = {
  Admin: '/admin',
  panadero: '/panadero',
  vendedor: '/vendedor',
  planificacion: '/planificacion',
}

interface Props {
  user: CurrentUser
  children: React.ReactNode
}

export default function AppShell({ user, children }: Props) {
  async function logout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    const cookieStore = await cookies()
    cookieStore.delete('payitos-role')
    redirect('/login')
  }

  return (
    <div className="flex flex-col h-dvh" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="shrink-0 h-14 bg-white flex items-center justify-between px-4 z-10"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        {/* Logo real de Payitos — clic lleva al dashboard del rol */}
        <Link href={DASHBOARD_PATH[user.role] ?? '/'} aria-label="Ir al inicio" className="shrink-0">
          <Image
            src="/logo-payitos.svg"
            alt="Payito's"
            width={110}
            height={40}
            className="h-8 w-auto logo-payitos"
            style={{ filter: 'brightness(0) saturate(100%) invert(35%) sepia(80%) saturate(600%) hue-rotate(305deg) brightness(95%)' }}
            priority
          />
        </Link>

        <div className="flex items-center gap-2">
          <span
            className="text-sm truncate max-w-[150px] hidden sm:block"
            style={{ color: 'var(--ink-muted)' }}
          >
            {user.name}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm px-2.5 py-1.5 rounded-lg transition-colors duration-150"
              style={{ color: 'var(--ink-faint)' }}
              onMouseOver={undefined}
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      {/* Contenido scrollable */}
      <SwipeNavigation role={user.role}>
        {children}
      </SwipeNavigation>

      {/* Navegación inferior */}
      <BottomNav role={user.role} />
    </div>
  )
}
