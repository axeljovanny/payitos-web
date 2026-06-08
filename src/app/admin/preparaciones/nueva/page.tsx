import { fetchPreparationOptions, fetchPrepCostMap } from '@/lib/preparaciones/queries'
import { fetchIngredientOptions, fetchLatestIngredientPrices } from '@/lib/ingredientes/queries'
import { createPreparation } from '@/lib/preparaciones/actions'
import PreparacionForm from '@/components/preparaciones/preparacion-form'
import BackButton from '@/components/ui/back-button'

export default async function NuevaPreparacionPage() {
  const [ingredients, preparations, prices, prepCosts] = await Promise.all([
    fetchIngredientOptions(),
    fetchPreparationOptions(),
    fetchLatestIngredientPrices(),
    fetchPrepCostMap(),
  ])

  return (
    <div className="space-y-5">
      <BackButton href="/admin/preparaciones" label="Preparaciones" />
      <div>
        <h1 className="text-xl font-bold text-gray-800">Nueva preparación</h1>
        <p className="text-sm text-gray-500 mt-0.5">Subreceta reutilizable (Masa, Queso, Mermelada…).</p>
      </div>
      <PreparacionForm
        ingredients={ingredients}
        preparations={preparations}
        prices={prices}
        prepCosts={prepCosts}
        action={createPreparation}
      />
    </div>
  )
}
