import { fetchDailyView } from '@/lib/inventory/queries'
import DailySheetView from '@/components/inventory/daily-sheet'

export default async function PanaderoPage() {
  const view = await fetchDailyView()
  return <DailySheetView view={view} />
}
