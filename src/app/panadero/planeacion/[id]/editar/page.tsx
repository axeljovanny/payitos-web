import { notFound, redirect } from 'next/navigation'
import {
  getWeeklyPlanById,
  getProductsForPlan,
  getWeeklyPlanSpecialOrders,
  formatWeekLabel,
} from '@/lib/planeacion/queries'
import { updateWeeklyPlan } from '@/lib/planeacion/actions'
import PlaneacionSemana from '@/components/planeacion/planeacion-semana'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarPlaneacionPage({ params }: Props) {
  const { id } = await params

  const planResult = await getWeeklyPlanById(id)
  if (!planResult) notFound()

  const { plan, items } = planResult

  if (plan.status !== 'draft') {
    redirect(`/panadero/planeacion/${id}`)
  }

  const [products, specialOrdersByDay] = await Promise.all([
    getProductsForPlan(),
    getWeeklyPlanSpecialOrders(plan.week_start),
  ])

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs mb-1" style={{ color: 'var(--ink-faint)' }}>
          Semana
        </p>
        <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
          {formatWeekLabel(plan.week_start)}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--ink-muted)' }}>
          Captura cuántas piezas se producirán cada día.
        </p>
      </div>

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
      />
    </div>
  )
}
