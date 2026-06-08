import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getWeeklyPlanById,
  getWeeklyPlanSpecialOrders,
  getWeeklyPlanIngredientRequirements,
  getWeeklyPlanCapacity,
  formatWeekLabel,
} from '@/lib/planeacion/queries'
import { approveWeeklyPlan, updateWeeklyPlan, reopenWeeklyPlan } from '@/lib/planeacion/actions'
import PlaneacionSemana from '@/components/planeacion/planeacion-semana'
import ResumenInsumos from '@/components/planeacion/resumen-insumos'
import CapacidadSemana from '@/components/planeacion/capacidad-semana'
import type { PlanStatus } from '@/lib/planeacion/types'
import { getProductsForPlan } from '@/lib/planeacion/queries'

interface Props {
  params: Promise<{ id: string }>
}

const STATUS_LABELS: Record<PlanStatus, string> = {
  draft: 'Borrador',
  confirmed: 'Aprobada',
}

export default async function PlaneacionDetailPage({ params }: Props) {
  const { id } = await params

  const [planResult, products, ingredients, capacity] = await Promise.all([
    getWeeklyPlanById(id),
    getProductsForPlan(),
    getWeeklyPlanIngredientRequirements(id),
    getWeeklyPlanCapacity(id),
  ])

  if (!planResult) notFound()

  const { plan, items } = planResult
  const specialOrdersByDay = await getWeeklyPlanSpecialOrders(plan.week_start)
  const isDraft = plan.status === 'draft'

  // Per-product totals for the week
  const productTotals = new Map<string, { name: string; qty: number; fromSpecials: number }>()
  for (const item of items) {
    const pName = (item.products as { name: string } | null | undefined)?.name ?? item.product_id
    const prev = productTotals.get(item.product_id)
    productTotals.set(item.product_id, {
      name: pName,
      qty: (prev?.qty ?? 0) + item.quantity_planned,
      fromSpecials: prev?.fromSpecials ?? 0,
    })
  }
  for (const dayOrders of Object.values(specialOrdersByDay)) {
    for (const sp of dayOrders) {
      if (!sp.product_id) continue
      const prev = productTotals.get(sp.product_id)
      productTotals.set(sp.product_id, {
        name: sp.product_name,
        qty: prev?.qty ?? 0,
        fromSpecials: (prev?.fromSpecials ?? 0) + sp.quantity,
      })
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/panadero/planeacion"
            className="text-xs mb-1 inline-block"
            style={{ color: 'var(--ink-faint)' }}
          >
            ← Planeación
          </Link>
          <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
            {formatWeekLabel(plan.week_start)}
          </h1>
          <span
            className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={
              isDraft
                ? { background: '#fef3c7', color: '#92400e' }
                : { background: '#dcfce7', color: '#166534' }
            }
          >
            {STATUS_LABELS[plan.status]}
          </span>
        </div>

        {isDraft && (
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/panadero/planeacion/${plan.id}/editar`}
              className="rounded-xl text-sm font-bold px-3.5 py-2.5 transition-[transform,box-shadow] active:scale-[0.97]"
              style={{
                background: 'linear-gradient(180deg, #f06090 0%, #ed507c 100%)',
                color: '#ffffe9',
                boxShadow: '0 3px 10px rgba(237,80,124,0.30)',
              }}
            >
              Editar
            </Link>
          </div>
        )}
      </div>

      {/* Weekly matrix (read-only view) */}
      <PlaneacionSemana
        planId={plan.id}
        weekStart={plan.week_start}
        products={products}
        initialItems={items.map((i) => ({
          product_id: i.product_id,
          day_of_week: i.day_of_week,
          quantity_planned: i.quantity_planned,
        }))}
        specialOrdersByDay={specialOrdersByDay}
        action={updateWeeklyPlan}
        readOnly
      />

      {/* Product totals for the week */}
      {productTotals.size > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
              Resumen por producto
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {Array.from(productTotals.values())
              .sort((a, b) => b.qty + b.fromSpecials - (a.qty + a.fromSpecials))
              .map((pt) => {
                const total = pt.qty + pt.fromSpecials
                return (
                  <div key={pt.name} className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {pt.name}
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      {pt.fromSpecials > 0 && (
                        <span style={{ color: '#3b82f6' }}>+{pt.fromSpecials} ev.</span>
                      )}
                      <span className="font-bold" style={{ color: 'var(--foreground)' }}>
                        {total} pzas
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {isDraft && (
        <form action={approveWeeklyPlan}>
          <input type="hidden" name="plan_id" value={plan.id} />
          <input type="hidden" name="return_path" value="/panadero/planeacion" />
          <button
            type="submit"
            className="w-full rounded-2xl text-sm font-bold px-4 py-3.5 transition-[transform,box-shadow] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(180deg, #4ade80 0%, #16a34a 100%)',
              color: '#fff',
              boxShadow: '0 3px 10px rgba(22,163,74,0.30)',
            }}
          >
            Aprobar planeación
          </button>
        </form>
      )}

      {!isDraft && (
        <div className="space-y-2">
          <p className="text-xs text-center" style={{ color: 'var(--ink-faint)' }}>
            Para editar esta semana primero reabre el borrador.
          </p>
          <form action={reopenWeeklyPlan}>
            <input type="hidden" name="plan_id" value={plan.id} />
            <input type="hidden" name="return_path" value={`/panadero/planeacion/${plan.id}/editar`} />
            <button
              type="submit"
              className="w-full rounded-2xl text-sm font-bold px-4 py-3.5 transition-[transform,box-shadow] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(180deg, #f06090 0%, #ed507c 100%)',
                color: '#ffffe9',
                boxShadow: '0 3px 10px rgba(237,80,124,0.30)',
              }}
            >
              Reabrir como borrador → Editar
            </button>
          </form>
        </div>
      )}

      {/* Capacity summary */}
      {capacity && (
        <div className="space-y-2">
          <CapacidadSemana summary={capacity} />
        </div>
      )}

      {/* Ingredient requirements */}
      <div className="space-y-2">
        <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
          Requerimiento de insumos
        </h2>
        <ResumenInsumos result={ingredients} />
      </div>
    </div>
  )
}
