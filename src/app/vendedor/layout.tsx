import { requireRole } from '@/lib/auth/require-role'
import AppShell from '@/components/app-shell'

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('vendedor')
  return <AppShell user={user}>{children}</AppShell>
}
