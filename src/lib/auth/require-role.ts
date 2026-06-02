import { redirect } from 'next/navigation'
import { getCurrentUser, getRoleDashboardPath, type UserRole } from '@/lib/supabase/user'

export async function requireRole(expected: UserRole) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== expected) redirect(getRoleDashboardPath(user.role))
  return user
}
