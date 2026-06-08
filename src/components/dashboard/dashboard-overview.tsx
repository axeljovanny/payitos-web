import Link from 'next/link'
import type { DashboardData } from '@/lib/dashboard/queries'
import { formatMXN, formatPercent } from '@/lib/costing/format'
import DashboardSimulator from './dashboard-simulator'

const BAR_COLORS = ['#ed507c', '#f0853f', '#e0b341', '#5aa66f', '#5a8fce', '#9b6bd0', '#c45a8f']

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const {
    monthlyFixed, monthlyLaborCurrent, monthlyLaborTarget, monthlyTotalCurrent, monthlyTotalTarget,
    budget, avgPrice, avgIngredientCost, avgContribution, contributionMarginPct,
    breakevenPiecesCurrent, breakevenRevenueCurrent, breakevenPiecesTarget, breakevenRevenueTarget,
    piecesPerWeekCurrent, piecesPerDayCurrent, productsBelowCost, productsCounted,
    hasFixed, hasLabor, hasPricedProducts, canBreakEven,
  } = data

  const noBudget = !hasFixed && !hasLabor
  const hasTargetGap = monthlyLaborTarget > monthlyLaborCurrent + 0.5

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Panel de administración</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--ink-muted)' }}>
          Cuánto necesitas vender para cubrir gastos y pagar sueldos.
        </p>
      </div>

      {/* Faltan datos base */}
      {noBudget && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Faltan datos para calcular el punto de equilibrio</p>
          <p className="text-xs">
            Captura tus <Link href="/admin/gastos" className="underline font-medium">costos fijos y sueldos</Link> para ver
            cuánto pan necesitas vender al mes.
          </p>
        </div>
      )}

      {/* ── Gasto mensual a cubrir ── */}
      {!noBudget && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Gasto mensual a cubrir</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Sueldos (actuales)</span>
            <span className="font-medium text-gray-800">{formatMXN(monthlyLaborCurrent)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Costos fijos</span>
            <span className="font-medium text-gray-800">{formatMXN(monthlyFixed)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
            <span className="text-gray-600 font-medium">Total al mes</span>
            <span className="font-bold text-[#d43a6a] text-base">{formatMXN(monthlyTotalCurrent)}</span>
          </div>
        </div>
      )}

      {/* ── No se puede equilibrar: productos bajo costo ── */}
      {!noBudget && hasPricedProducts && !canBreakEven && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold mb-1">Tus precios no cubren ni los ingredientes</p>
          <p className="text-xs">
            El margen de contribución promedio es negativo ({formatMXN(avgContribution)}/pieza),
            así que no hay punto de equilibrio posible. Sube precios o baja costos.
            {productsBelowCost.length > 0 && <> Productos bajo costo: {productsBelowCost.join(', ')}.</>}
          </p>
        </div>
      )}

      {/* ── Punto de equilibrio (precios actuales) ── */}
      {!noBudget && hasPricedProducts && canBreakEven && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Punto de equilibrio</p>

          <div className="rounded-lg bg-pink-50 border border-pink-100 p-3 text-center">
            <p className="text-xs text-gray-500">Necesitas vender al mes</p>
            <p className="text-3xl font-bold text-[#d43a6a] mt-0.5">{breakevenPiecesCurrent} pzas</p>
            <p className="text-xs text-gray-500 mt-0.5">
              ≈ {piecesPerWeekCurrent}/semana · {piecesPerDayCurrent}/día de producción
            </p>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Eso genera (ventas/mes)</span>
            <span className="font-semibold text-gray-800">{formatMXN(breakevenRevenueCurrent ?? 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Precio promedio / pieza</span>
            <span className="font-medium text-gray-700">{formatMXN(avgPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              Margen de contribución / pieza
              <span className="text-gray-400 ml-1 text-xs">(precio − ingredientes)</span>
            </span>
            <span className="font-medium text-gray-700">
              {formatMXN(avgContribution)}
              {contributionMarginPct != null && <span className="text-gray-400"> ({formatPercent(contributionMarginPct)})</span>}
            </span>
          </div>
          <p className="text-xs text-gray-400 pt-1">
            Promedio sobre {productsCounted} producto{productsCounted !== 1 ? 's' : ''} con precio y costo. El mix real ajusta el número.
          </p>
        </div>
      )}

      {/* ── Simulador interactivo (mix por producto) ── */}
      {!noBudget && hasPricedProducts && (
        <DashboardSimulator
          products={data.simProducts}
          monthlyTotalCurrent={monthlyTotalCurrent}
          monthlyTotalTarget={monthlyTotalTarget}
          hasTargetGap={hasTargetGap}
        />
      )}

      {/* ── Para pagar sueldos deseados ── */}
      {!noBudget && hasPricedProducts && canBreakEven && hasTargetGap && breakevenPiecesTarget != null && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Si quieres pagar los sueldos deseados</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Gasto mensual con sueldos deseados</span>
            <span className="font-medium text-gray-800">{formatMXN(monthlyTotalTarget)}</span>
          </div>
          <div className="rounded-lg bg-pink-50 border border-pink-100 p-3 text-center mt-1">
            <p className="text-xs text-gray-500">Necesitas vender al mes</p>
            <p className="text-2xl font-bold text-[#d43a6a] mt-0.5">{breakevenPiecesTarget} pzas</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatMXN(breakevenRevenueTarget ?? 0)} en ventas
              {breakevenPiecesCurrent != null && (
                <> · +{breakevenPiecesTarget - breakevenPiecesCurrent} pzas vs actual</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── Reparto del presupuesto ── */}
      {!noBudget && budget.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cómo se reparte tu presupuesto</p>
          <div className="space-y-2.5">
            {budget.map((slice, i) => (
              <div key={slice.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{slice.label}</span>
                  <span className="font-medium text-gray-800">
                    {formatMXN(slice.amount)} <span className="text-gray-400">({formatPercent(slice.percent)})</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, slice.percent)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pista si faltan precios de productos */}
      {!noBudget && !hasPricedProducts && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          Para calcular cuánto pan vender, define <Link href="/admin/productos" className="underline font-medium text-[#d43a6a]">precios de venta</Link> y
          un <Link href="/admin/procesos" className="underline font-medium text-[#d43a6a]">proceso con costos</Link> en tus productos.
        </div>
      )}
    </div>
  )
}
