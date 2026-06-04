import { cookies } from 'next/headers'
import { cache } from 'react'
import { createClient } from './server'

export type UserRole = 'Admin' | 'panadero' | 'vendedor' | 'planificacion'

export interface CurrentUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export const getCurrentUser = cache(async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()

  // getSession() validates the JWT locally (no network call to Supabase Auth
  // unless the token is expired and needs refreshing via the refresh token).
  // The layout's requireRole calls this once per render; using getSession() here
  // halves the auth round-trips vs. getUser() which always hits the Auth server.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) return null
  const user = session.user

  // Fast path: payitos-role cookie is set server-side on login and removed on
  // logout — safe to trust within the same request. Falls back to RPC only on
  // first load after cookie expiry.
  const cookieStore = await cookies()
  let roleName: string | null = cookieStore.get('payitos-role')?.value ?? null
  if (!roleName) {
    const { data } = await supabase.rpc('current_user_role')
    roleName = data ?? null
  }
  if (!roleName) return null

  // Profile name from public.users — RLS-protected; falls back to email prefix.
  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email ?? '',
    name: profile?.name ?? user.email?.split('@')[0] ?? 'Usuario',
    role: roleName as UserRole,
  }
})

export function getRoleDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    Admin: '/admin',
    panadero: '/panadero',
    vendedor: '/vendedor',
    planificacion: '/planificacion',
  }
  return paths[role] ?? '/login'
}
