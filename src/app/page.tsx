import { redirect } from 'next/navigation'
import { getCurrentUser, getRoleDashboardPath } from '@/lib/supabase/user'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  redirect(getRoleDashboardPath(user.role))
}
