import { requireRole } from '@/lib/auth/require-role'
import AppShell from '@/components/app-shell'

export default async function PanaderoLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('panadero')
  return <AppShell user={user}>{children}</AppShell>
}
