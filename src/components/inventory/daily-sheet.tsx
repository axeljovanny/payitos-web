import Image from 'next/image'
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

const SHEET_STATUS: Record<string, { label: string; style: React.CSSProperties }> = {
  pending: {
    label: 'Pendiente',
    style: { background: 'var(--border-subtle)', color: 'var(--ink-muted)' },
  },
  in_progress: {
    label: 'En progreso',
    style: { background: 'var(--brand-light)', color: 'var(--brand-dark)' },
  },
  completed: {
    label: 'Completada',
    style: { background: 'var(--brand-cream)', color: 'var(--brand-dark)' },
  },
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

function itemStatus(planned: number, produced: number): { label: string; style: React.CSSProperties } {
  if (planned > 0 && produced >= planned) {
    return { label: 'Listo', style: { color: 'var(--brand-dark)' } }
  }
  if (produced > 0) {
    return { label: 'En proceso', style: { color: 'var(--brand)' } }
  }
  return { label: 'Pendiente', style: { color: 'var(--ink-faint)' } }
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
          <h1 className="text-xl font-bold capitalize" style={{ color: 'var(--foreground)' }}>
            {formatDateLong(date)}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ink-faint)' }}>
            {items.length === 0
              ? 'Sin producción planeada'
              : `${totalProduced} / ${totalPlanned} piezas`}
          </p>
        </div>
        {sheet && (
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
            style={SHEET_STATUS[sheet.status]?.style ?? { background: 'var(--border-subtle)', color: 'var(--ink-muted)' }}
          >
            {SHEET_STATUS[sheet.status]?.label ?? sheet.status}
          </span>
        )}
      </div>

      {/* ── Production list ── */}
      {items.length === 0 ? (
        <div
          className="rounded-xl px-6 py-12 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <Image
            src="/icono-payitos-blush.svg"
            alt=""
            width={64}
            height={64}
            className="mx-auto mb-4 opacity-70"
          />
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Sin producción planeada para hoy.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>
            Configura el plan semanal desde el módulo de Planificación.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
              Producción del día
            </p>
            {fromWeeklyPlan && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)' }}
              >
                del plan semanal
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--border-subtle)' }}>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--ink-muted)' }}>Producto</th>
                  <th className="text-right px-4 py-2 font-medium whitespace-nowrap" style={{ color: 'var(--ink-muted)' }}>
                    Plan
                  </th>
                  <th className="text-right px-4 py-2 font-medium whitespace-nowrap" style={{ color: 'var(--ink-muted)' }}>
                    Hecho
                  </th>
                  <th className="text-right px-4 py-2 font-medium" style={{ color: 'var(--ink-muted)' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const { label, style: statusStyle } = itemStatus(
                    item.quantity_planned,
                    item.quantity_produced
                  )
                  return (
                    <tr key={item.product_id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td className="px-4 py-2.5" style={{ color: 'var(--foreground)' }}>
                        <span className="font-medium">{item.product_name}</span>
                        {item.cooking_type && (
                          <span className="ml-1.5 text-xs" style={{ color: 'var(--ink-faint)' }}>
                            {COOKING_LABELS[item.cooking_type] ?? item.cooking_type}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right" style={{ color: 'var(--ink-muted)' }}>
                        {item.quantity_planned}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--foreground)' }}>
                        {item.quantity_produced}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right text-xs font-medium whitespace-nowrap"
                        style={statusStyle}
                      >
                        {label}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--border-subtle)' }}>
                  <td className="px-4 py-2 font-semibold" style={{ color: 'var(--foreground)' }}>Total</td>
                  <td className="px-4 py-2 text-right font-semibold" style={{ color: 'var(--ink-muted)' }}>
                    {totalPlanned}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold" style={{ color: 'var(--foreground)' }}>
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
          <p className="text-xs font-semibold uppercase tracking-wide px-1" style={{ color: 'var(--ink-faint)' }}>
            Órdenes especiales de hoy
          </p>
          {special_orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl px-4 py-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>{order.customer_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ink-faint)' }}>
                    Entrega: {formatDateShort(order.delivery_date)}
                  </p>
                </div>
                <span
                  className="shrink-0 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)' }}
                >
                  {SPECIAL_ORDER_STATUS[order.status] ?? order.status}
                </span>
              </div>

              {order.special_order_items.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {order.special_order_items.map((item) => (
                    <li key={item.id} className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                      • {item.product_name} × {item.quantity}
                      {item.notes && (
                        <span className="text-xs ml-1" style={{ color: 'var(--ink-faint)' }}>({item.notes})</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {order.notes && (
                <p className="text-xs mt-2 italic" style={{ color: 'var(--ink-faint)' }}>{order.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
