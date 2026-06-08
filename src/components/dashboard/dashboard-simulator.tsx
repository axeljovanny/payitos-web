'use client'

import { useState, useMemo } from 'react'
import { formatMXN } from '@/lib/costing/format'
import type { SimProduct } from '@/lib/dashboard/queries'

interface Props {
  products: SimProduct[]
  monthlyTotalCurrent: number
  monthlyTotalTarget: number
  hasTargetGap: boolean
}

export default function DashboardSimulator({
  products, monthlyTotalCurrent, monthlyTotalTarget, hasTargetGap,
}: Props) {
  const [qty, setQty] = useState<Record<string, string>>({})

  const sim = useMemo(() => {
    let pieces = 0, revenue = 0, contribution = 0
    for (const p of products) {
      const n = Math.max(0, Number(qty[p.id]) || 0)
      if (n === 0) continue
      pieces += n
      revenue += n * p.price
      contribution += n * p.contribution
    }
    const balanceCurrent = contribution - monthlyTotalCurrent
    const balanceTarget = contribution - monthlyTotalTarget
    return {
      pieces, revenue, contribution, balanceCurrent, balanceTarget,
      coversCurrent: balanceCurrent >= 0,
      coversTarget: balanceTarget >= 0,
      empty: pieces === 0,
    }
  }, [qty, products, monthlyTotalCurrent, monthlyTotalTarget])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Simulador de venta mensual</p>
        <p className="text-xs text-gray-400 mt-0.5">Pon cuántas piezas de cada pan venderías al mes.</p>
      </div>

      {/* Veredicto en vivo */}
      <div
        className={`rounded-lg p-3 text-center border ${
          sim.empty ? 'bg-gray-50 border-gray-200'
            : sim.coversCurrent ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}
      >
        {sim.empty ? (
          <p className="text-sm text-gray-500">Agrega cantidades abajo para ver si cubres la cuota.</p>
        ) : (
          <>
            <p className={`text-base font-bold ${sim.coversCurrent ? 'text-green-700' : 'text-red-700'}`}>
              {sim.coversCurrent ? '✓ Cubres la cuota del mes' : '✗ No cubres la cuota'}
            </p>
            <p className={`text-sm mt-0.5 ${sim.coversCurrent ? 'text-green-600' : 'text-red-600'}`}>
              {sim.coversCurrent
                ? `Te sobran ${formatMXN(sim.balanceCurrent)} al mes`
                : `Te faltan ${formatMXN(-sim.balanceCurrent)} al mes`}
            </p>
          </>
        )}
      </div>

      {/* Lista de productos */}
      <div className="divide-y divide-gray-100 -mx-1">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-1 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
              <p className="text-xs text-gray-400">
                {formatMXN(p.price)} · aporta {formatMXN(p.contribution)}/pza
                {p.contribution <= 0 && <span className="text-red-500"> ⚠ bajo costo</span>}
              </p>
            </div>
            <input
              type="number"
              min="0"
              step="10"
              inputMode="numeric"
              placeholder="0"
              value={qty[p.id] ?? ''}
              onChange={(e) => setQty((prev) => ({ ...prev, [p.id]: e.target.value }))}
              className="w-24 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]"
            />
          </div>
        ))}
      </div>

      {/* Totales */}
      {!sim.empty && (
        <div className="border-t border-gray-200 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Piezas / mes</span>
            <span className="font-medium text-gray-800">{sim.pieces.toLocaleString('es-MX')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ventas estimadas</span>
            <span className="font-medium text-gray-800">{formatMXN(sim.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">
              Para cubrir gastos
              <span className="text-gray-400 ml-1 text-xs">(margen contribución)</span>
            </span>
            <span className="font-medium text-gray-800">{formatMXN(sim.contribution)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-1.5">
            <span className="text-gray-600 font-medium">Cuota mensual</span>
            <span className="font-semibold text-gray-800">{formatMXN(monthlyTotalCurrent)}</span>
          </div>
          {hasTargetGap && (
            <div className="flex justify-between text-xs pt-1">
              <span className="text-gray-500">¿Alcanza para sueldos deseados ({formatMXN(monthlyTotalTarget)})?</span>
              <span className={`font-semibold ${sim.coversTarget ? 'text-green-600' : 'text-amber-600'}`}>
                {sim.coversTarget ? 'Sí ✓' : `Faltan ${formatMXN(-sim.balanceTarget)}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
