import { cookies } from 'next/headers'
import { createClient } from './server'

export type UserRole = 'Admin' | 'panadero' | 'vendedor' | 'planificacion'

export interface CurrentUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  // Fast path: cookie set by the login action (httpOnly, server-set — safe to trust).
  // Fallback: SECURITY DEFINER RPC when cookie is absent (e.g. after expiry).
  // Avoids a loop where current_user_role() returns null if auth.uid() doesn't
  // match public.users.id due to seeded-ID mismatch.
  const cookieStore = await cookies()
  let roleName: string | null = cookieStore.get('payitos-role')?.value ?? null
  if (!roleName) {
    const { data } = await supabase.rpc('current_user_role')
    roleName = data ?? null
  }
  if (!roleName) return null

  // public.users read may be blocked by RLS; fall back to email prefix as name
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
}

export function getRoleDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    Admin: '/admin',
    panadero: '/panadero',
    vendedor: '/vendedor',
    planificacion: '/planificacion',
  }
  return paths[role] ?? '/login'
}
