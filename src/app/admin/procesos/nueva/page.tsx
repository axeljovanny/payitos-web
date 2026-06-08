import { fetchProductOptions } from '@/lib/procesos/queries'
import { createProcess } from '@/lib/procesos/actions'
import { fetchPreparationOptions, fetchPrepCostMap } from '@/lib/preparaciones/queries'
import { fetchIngredientOptions, fetchLatestIngredientPrices } from '@/lib/ingredientes/queries'
import { fetchLaborCostContext, fetchOverheadCostContext } from '@/lib/costing/queries'
import ProcesoForm from '@/components/procesos/proceso-form'
import BackButton from '@/components/ui/back-button'

export default async function NuevoProcesoPage() {
  const [products, ingredients, preparations, prices, prepCosts, laborCtx, overheadCtx] = await Promise.all([
    fetchProductOptions(),
    fetchIngredientOptions(),
    fetchPreparationOptions(),
    fetchLatestIngredientPrices(),
    fetchPrepCostMap(),
    fetchLaborCostContext(),
    fetchOverheadCostContext(),
  ])

  const overheadPerHour = overheadCtx
    ? overheadCtx.fixed_cost_per_hour + overheadCtx.energy_cost_per_hour
    : null

  return (
    <div className="space-y-5">
      <BackButton href="/admin/procesos" label="Procesos" />
      <div>
        <h1 className="text-xl font-bold text-gray-800">Nuevo proceso</h1>
        <p className="text-sm text-gray-500 mt-0.5">Corrida que produce una o varias variantes.</p>
      </div>
      <ProcesoForm
        products={products}
        ingredients={ingredients}
        preparations={preparations}
        prices={prices}
        prepCosts={prepCosts}
        hourlyLaborRate={laborCtx?.average_hourly_rate ?? null}
        overheadPerHour={overheadPerHour}
        action={createProcess}
      />
    </div>
  )
}
