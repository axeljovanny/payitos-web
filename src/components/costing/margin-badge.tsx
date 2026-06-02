import type { CostStatus } from '@/lib/costing/types'

const CONFIG: Record<CostStatus, { label: string; className: string }> = {
  ok: {
    label: 'Margen OK',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  margin_low: {
    label: 'Margen bajo',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  price_insufficient: {
    label: 'Precio insuficiente',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  incomplete_prices: {
    label: 'Precios incompletos',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  no_recipe: {
    label: 'Sin receta',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
}

export default function MarginBadge({ status }: { status: CostStatus }) {
  const { label, className } = CONFIG[status]
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      {label}
    </span>
  )
}
