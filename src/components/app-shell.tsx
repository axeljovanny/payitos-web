import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CurrentUser } from '@/lib/supabase/user'
import BottomNav from './nav'

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
    <div className="flex flex-col h-dvh bg-gray-50">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="shrink-0 h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-10">
        <span className="font-bold text-amber-800 text-base tracking-tight">
          Payitos
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 truncate max-w-[160px] hidden sm:block">
            {user.name}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      {/* ── Contenido scrollable ────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-4 py-5">
          {children}
        </div>
      </main>

      {/* ── Navegación inferior ─────────────────────────────── */}
      <BottomNav role={user.role} />
    </div>
  )
}
