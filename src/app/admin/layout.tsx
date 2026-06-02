import { requireRole } from '@/lib/auth/require-role'
import AppShell from '@/components/app-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('Admin')
  return <AppShell user={user}>{children}</AppShell>
}
