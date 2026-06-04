import Link from 'next/link'
import { fetchCostBreakdowns } from '@/lib/costing/queries'
import CostosList from '@/components/costing/costos-list'

export default async function AdminCostosPage() {
  const items = await fetchCostBreakdowns()
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Catálogo de costos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>
            Costo estimado por pieza basado en ingredientes y recetas activas.
          </p>
        </div>
        <Link
          href="/admin/gastos"
          className="shrink-0 rounded-xl text-sm font-bold px-4 py-2.5 transition-[transform,box-shadow] active:scale-[0.97]"
          style={{
            background: 'linear-gradient(180deg, #f06090 0%, #ed507c 100%)',
            color: '#ffffe9',
            boxShadow: '0 3px 10px rgba(237,80,124,0.30)',
          }}
        >
          Ver gastos
        </Link>
      </div>
      <CostosList items={items} basePath="/admin/costos" />
    </div>
  )
}
