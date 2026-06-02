import type { DailyView } from '@/lib/inventory/types'

interface Props {
  view: DailyView
}

function formatDateLong(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateShort(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

const SHEET_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'En progreso', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completada', className: 'bg-green-100 text-green-700' },
}

const COOKING_LABELS: Record<string, string> = {
  horno: 'Horno',
  estufa: 'Estufa',
  frio: 'Frío',
  otro: 'Otro',
}

const SPECIAL_ORDER_STATUS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  in_production: 'En producción',
  ready: 'Listo para entregar',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

function itemStatus(planned: number, produced: number) {
  if (planned > 0 && produced >= planned) {
    return { label: 'Listo', className: 'text-green-600' }
  }
  if (produced > 0) {
    return { label: 'En proceso', className: 'text-amber-600' }
  }
  return { label: 'Pendiente', className: 'text-gray-400' }
}

export default function DailySheetView({ view }: Props) {
  const { date, sheet, items, special_orders } = view

  const totalPlanned = items.reduce((s, i) => s + i.quantity_planned, 0)
  const totalProduced = items.reduce((s, i) => s + i.quantity_produced, 0)
  const fromWeeklyPlan = sheet === null && items.length > 0

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800 capitalize">
            {formatDateLong(date)}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {items.length === 0
              ? 'Sin producción planeada'
              : `${totalProduced} / ${totalPlanned} piezas`}
          </p>
        </div>
        {sheet && (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              SHEET_STATUS[sheet.status]?.className ?? 'bg-gray-100 text-gray-500'
            }`}
          >
            {SHEET_STATUS[sheet.status]?.label ?? sheet.status}
          </span>
        )}
      </div>

      {/* ── Production list ── */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No hay producción planeada para hoy.</p>
          <p className="text-xs text-gray-400 mt-1">
            Configura el plan semanal desde el módulo de Planificación.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Producción del día
            </p>
            {fromWeeklyPlan && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                del plan semanal
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Producto</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500 whitespace-nowrap">
                    Plan
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500 whitespace-nowrap">
                    Hecho
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const { label, className } = itemStatus(
                    item.quantity_planned,
                    item.quantity_produced
                  )
                  return (
                    <tr key={item.product_id} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 text-gray-800">
                        <span className="font-medium">{item.product_name}</span>
                        {item.cooking_type && (
                          <span className="ml-1.5 text-xs text-gray-400">
                            {COOKING_LABELS[item.cooking_type] ?? item.cooking_type}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500">
                        {item.quantity_planned}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                        {item.quantity_produced}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right text-xs font-medium whitespace-nowrap ${className}`}
                      >
                        {label}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-4 py-2 font-semibold text-gray-700">Total</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-500">
                    {totalPlanned}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-800">
                    {totalProduced}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Special orders ── */}
      {special_orders.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Órdenes especiales de hoy
          </p>
          {special_orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-amber-200 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-800">{order.customer_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Entrega: {formatDateShort(order.delivery_date)}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {SPECIAL_ORDER_STATUS[order.status] ?? order.status}
                </span>
              </div>

              {order.special_order_items.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {order.special_order_items.map((item) => (
                    <li key={item.id} className="text-sm text-gray-600">
                      • {item.product_name} × {item.quantity}
                      {item.notes && (
                        <span className="text-xs text-gray-400 ml-1">({item.notes})</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {order.notes && (
                <p className="text-xs text-gray-400 mt-2 italic">{order.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
