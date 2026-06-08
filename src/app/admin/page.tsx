import { fetchDashboardData } from '@/lib/dashboard/queries'
import DashboardOverview from '@/components/dashboard/dashboard-overview'

export default async function AdminPage() {
  const data = await fetchDashboardData()
  return <DashboardOverview data={data} />
}
