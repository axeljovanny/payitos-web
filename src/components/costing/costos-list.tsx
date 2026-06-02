import Link from 'next/link'
import type { CostBreakdown } from '@/lib/costing/types'
import { formatMXN, formatPercent } from '@/lib/costing/format'
import MarginBadge from './margin-badge'

interface Props {
  items: CostBreakdown[]
  basePath: string
}

export default function CostosList({ items, basePath }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-sm text-gray-500">No hay productos activos para mostrar.</p>
        <p className="text-xs text-gray-400 mt-1">
          Verifica que existen productos activos en Supabase y que las políticas RLS permiten el
          acceso a este rol.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const { product, cost_per_piece, margin_percent, status } = item
        return (
          <Link
            key={product.id}
            href={`${basePath}/${product.id}`}
            className="block bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-amber-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
              </div>
              <MarginBadge status={status} />
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="text-gray-500">
                Costo/pz:{' '}
                <span className="font-medium text-gray-700">
                  {cost_per_piece != null ? formatMXN(cost_per_piece) : '—'}
                </span>
              </span>
              <span className="text-gray-500">
                Precio venta:{' '}
                <span className="font-medium text-gray-700">{formatMXN(product.sale_price)}</span>
              </span>
              {margin_percent != null && (
                <span className="text-gray-500">
                  Margen:{' '}
                  <span className="font-medium text-gray-700">{formatPercent(margin_percent)}</span>
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
