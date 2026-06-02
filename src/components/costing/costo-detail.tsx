import Link from 'next/link'
import type { CostBreakdown } from '@/lib/costing/types'
import { formatMXN, formatPercent } from '@/lib/costing/format'
import MarginBadge from './margin-badge'

interface Props {
  breakdown: CostBreakdown
  backPath: string
}

const COOKING_LABELS: Record<string, string> = {
  horno: 'Horno',
  estufa: 'Estufa',
  frio: 'Frío',
  otro: 'Otro',
}

export default function CostoDetail({ breakdown, backPath }: Props) {
  const { product, recipe, lines, batch_cost, cost_per_piece, total_cost_per_piece, margin_percent, missing_prices, is_estimated, status } =
    breakdown

  const effectiveCostPP = total_cost_per_piece ?? cost_per_piece
  const suggestedPrice =
    effectiveCostPP != null &&
    product.target_margin_percent > 0 &&
    product.target_margin_percent < 100
      ? effectiveCostPP / (1 - product.target_margin_percent / 100)
      : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Link
          href={backPath}
          className="text-sm text-amber-700 hover:underline mb-3 inline-block"
        >
          ← Volver al catálogo
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{product.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {product.category}
              {recipe && (
                <> · {COOKING_LABELS[recipe.cooking_type] ?? recipe.cooking_type}</>
              )}
            </p>
          </div>
          <MarginBadge status={status} />
        </div>
      </div>

      {/* Alerta si falta info */}
      {missing_prices.length > 0 && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-700">
          <p className="font-medium mb-1">Costo estimado — datos incompletos</p>
          <ul className="space-y-0.5 text-xs">
            {missing_prices.map((msg, i) => (
              <li key={i}>• {msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sin receta */}
      {!recipe && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500">
          Este producto no tiene una receta activa registrada. Sin receta no es posible calcular el
          costo de ingredientes.
        </div>
      )}

      {/* Receta */}
      {recipe && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Receta
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">Rendimiento por lote</span>
              <span className="font-medium text-gray-800">
                {recipe.batch_yield} piezas
              </span>
              <span className="text-gray-500">Tiempo de producción</span>
              <span className="font-medium text-gray-800">
                {recipe.production_time_hours}h
              </span>
              <span className="text-gray-500">Cocción</span>
              <span className="font-medium text-gray-800">
                {COOKING_LABELS[recipe.cooking_type] ?? recipe.cooking_type}
              </span>
            </div>
          </div>

          {/* Tabla de ingredientes */}
          {lines.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-4 pb-2">
                Insumos
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-2 font-medium text-gray-500 whitespace-nowrap">
                        Insumo
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-gray-500 whitespace-nowrap">
                        Cantidad
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-gray-500 whitespace-nowrap">
                        Precio/u
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-gray-500 whitespace-nowrap">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-4 py-2 text-gray-800">
                          {line.ingredient_name}
                          {line.waste_factor_percent > 0 && (
                            <span className="text-xs text-gray-400 ml-1">
                              (+{line.waste_factor_percent}% merma)
                            </span>
                          )}
                          {line.unit_mismatch && (
                            <span className="text-xs text-orange-500 ml-1">(unidad incompatible)</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 whitespace-nowrap">
                          {line.quantity} {line.unit}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 whitespace-nowrap">
                          {line.unit_price != null ? formatMXN(line.unit_price) : '—'}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-gray-800 whitespace-nowrap">
                          {line.line_cost != null ? formatMXN(line.line_cost) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={3} className="px-4 py-2 font-semibold text-gray-700">
                        Costo total del lote
                        {is_estimated && (
                          <span className="ml-1 text-xs font-normal text-orange-600">(estimado)</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                        {batch_cost != null ? formatMXN(batch_cost) : '—'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Resumen de costos */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Resumen
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Costo por pieza</span>
            <span className="font-semibold text-gray-800">
              {cost_per_piece != null ? formatMXN(cost_per_piece) : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Precio de venta</span>
            <span className="font-semibold text-gray-800">{formatMXN(product.sale_price)}</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between">
            <span className="text-gray-500">
              Margen actual
              <span className="text-gray-400 ml-1 text-xs">
                (obj. {formatPercent(product.target_margin_percent)})
              </span>
            </span>
            <span
              className={`font-semibold ${
                margin_percent == null
                  ? 'text-gray-400'
                  : margin_percent < product.target_margin_percent
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}
            >
              {margin_percent != null ? formatPercent(margin_percent) : '—'}
            </span>
          </div>
          {suggestedPrice != null && (
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="text-gray-500">
                Precio sugerido
                <span className="text-gray-400 ml-1 text-xs">
                  ({formatPercent(product.target_margin_percent)} margen)
                </span>
              </span>
              <span
                className={`font-semibold ${
                  suggestedPrice > product.sale_price ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {formatMXN(suggestedPrice)}
              </span>
            </div>
          )}
        </div>

        {/* Alertas */}
        {status === 'price_insufficient' && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            El precio de venta no cubre el costo de ingredientes. Se vende por debajo del costo.
          </div>
        )}
        {status === 'margin_low' && (
          <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-700">
            El margen actual ({margin_percent != null ? formatPercent(margin_percent) : '—'}) está
            por debajo del objetivo ({formatPercent(product.target_margin_percent)}).
          </div>
        )}
      </div>

      {/* Nota costos pendientes */}
      <p className="text-xs text-gray-400 text-center">
        Este cálculo incluye solo el costo de ingredientes.
        Mano de obra, energía y costos fijos se integrarán en la siguiente fase.
      </p>
    </div>
  )
}
