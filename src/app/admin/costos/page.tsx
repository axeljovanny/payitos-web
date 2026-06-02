import { fetchCostBreakdowns } from '@/lib/costing/queries'
import CostosList from '@/components/costing/costos-list'

export default async function AdminCostosPage() {
  const items = await fetchCostBreakdowns()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Catálogo de costos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Costo estimado por pieza basado en ingredientes y recetas activas.
        </p>
      </div>
      <CostosList items={items} basePath="/admin/costos" />
    </div>
  )
}
