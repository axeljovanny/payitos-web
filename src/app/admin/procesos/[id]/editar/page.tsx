import { notFound } from 'next/navigation'
import { fetchProcessById, fetchProductOptions } from '@/lib/procesos/queries'
import { updateProcess } from '@/lib/procesos/actions'
import { fetchPreparationOptions, fetchPrepCostMap } from '@/lib/preparaciones/queries'
import { fetchIngredientOptions, fetchLatestIngredientPrices } from '@/lib/ingredientes/queries'
import { fetchLaborCostContext, fetchOverheadCostContext } from '@/lib/costing/queries'
import ProcesoForm from '@/components/procesos/proceso-form'
import BackButton from '@/components/ui/back-button'

interface Props { params: Promise<{ id: string }> }

export default async function EditarProcesoPage({ params }: Props) {
  const { id } = await params

  const [proceso, products, ingredients, preparations, prices, prepCosts, laborCtx, overheadCtx] = await Promise.all([
    fetchProcessById(id),
    fetchProductOptions(),
    fetchIngredientOptions(),
    fetchPreparationOptions(),
    fetchLatestIngredientPrices(),
    fetchPrepCostMap(),
    fetchLaborCostContext(),
    fetchOverheadCostContext(),
  ])

  if (!proceso) notFound()

  const overheadPerHour = overheadCtx
    ? overheadCtx.fixed_cost_per_hour + overheadCtx.energy_cost_per_hour
    : null

  return (
    <div className="space-y-5">
      <BackButton href="/admin/procesos" label="Procesos" />
      <div>
        <h1 className="text-xl font-bold text-gray-800">Editar proceso</h1>
        <p className="text-sm text-gray-500 mt-0.5">{proceso.name}</p>
      </div>
      <ProcesoForm
        products={products}
        ingredients={ingredients}
        preparations={preparations}
        prices={prices}
        prepCosts={prepCosts}
        hourlyLaborRate={laborCtx?.average_hourly_rate ?? null}
        overheadPerHour={overheadPerHour}
        action={updateProcess}
        defaultValues={proceso}
      />
    </div>
  )
}
