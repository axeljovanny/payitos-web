import { notFound } from 'next/navigation'
import { fetchPreparationById, fetchPreparationOptions, fetchPrepCostMap } from '@/lib/preparaciones/queries'
import { fetchIngredientOptions, fetchLatestIngredientPrices } from '@/lib/ingredientes/queries'
import { updatePreparation } from '@/lib/preparaciones/actions'
import PreparacionForm from '@/components/preparaciones/preparacion-form'
import BackButton from '@/components/ui/back-button'

interface Props { params: Promise<{ id: string }> }

export default async function EditarPreparacionPage({ params }: Props) {
  const { id } = await params

  const [prep, ingredients, preparations, prices, prepCosts] = await Promise.all([
    fetchPreparationById(id),
    fetchIngredientOptions(),
    fetchPreparationOptions(),
    fetchLatestIngredientPrices(),
    fetchPrepCostMap(),
  ])

  if (!prep) notFound()

  // Evitar que se seleccione a sí misma como anidada
  const selectablePreps = preparations.filter((p) => p.id !== id)

  return (
    <div className="space-y-5">
      <BackButton href="/admin/preparaciones" label="Preparaciones" />
      <div>
        <h1 className="text-xl font-bold text-gray-800">Editar preparación</h1>
        <p className="text-sm text-gray-500 mt-0.5">{prep.name}</p>
      </div>
      <PreparacionForm
        ingredients={ingredients}
        preparations={selectablePreps}
        prices={prices}
        prepCosts={prepCosts}
        action={updatePreparation}
        defaultValues={{
          id: prep.id,
          name: prep.name,
          yield_quantity: prep.yield_quantity,
          yield_unit: prep.yield_unit,
          notes: prep.notes,
          items: prep.items,
        }}
      />
    </div>
  )
}
