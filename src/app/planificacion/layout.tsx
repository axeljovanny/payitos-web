import { requireRole } from '@/lib/auth/require-role'
import AppShell from '@/components/app-shell'

export default async function PlanificacionLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('planificacion')
  return <AppShell user={user}>{children}</AppShell>
}
