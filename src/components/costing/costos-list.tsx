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
      <div
        className="rounded-xl p-10 text-center"
        style={{ border: '1px dashed var(--border)', background: 'var(--surface)' }}
      >
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>No hay productos activos para mostrar.</p>
        <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>
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
            className="block rounded-xl px-4 py-3 transition-all"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate" style={{ color: 'var(--foreground)' }}>{product.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--ink-faint)' }}>{product.category}</p>
              </div>
              <MarginBadge status={status} />
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--ink-muted)' }}>
              <span>
                Costo/pz:{' '}
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {cost_per_piece != null ? formatMXN(cost_per_piece) : '—'}
                </span>
              </span>
              <span>
                Precio venta:{' '}
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{formatMXN(product.sale_price)}</span>
              </span>
              {margin_percent != null && (
                <span>
                  Margen:{' '}
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{formatPercent(margin_percent)}</span>
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
