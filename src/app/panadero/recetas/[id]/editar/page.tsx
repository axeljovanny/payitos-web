import { notFound } from 'next/navigation'
import { fetchRecetaById, fetchProductOptions, fetchIngredientOptions } from '@/lib/recetas/queries'
import { fetchLatestIngredientPrices } from '@/lib/ingredientes/queries'
import { updateReceta } from '@/lib/recetas/actions'
import RecetaForm from '@/components/recetas/receta-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarRecetaPage({ params }: Props) {
  const { id } = await params

  const [receta, products, ingredients, prices] = await Promise.all([
    fetchRecetaById(id),
    fetchProductOptions(),
    fetchIngredientOptions(),
    fetchLatestIngredientPrices(),
  ])

  if (!receta) notFound()

  const defaultValues = {
    id: receta.id,
    product_id: receta.product_id,
    batch_yield: receta.batch_yield,
    production_time_hours: receta.production_time_hours,
    cooking_type: receta.cooking_type,
    ingredients: receta.recipe_ingredients.map((ri) => ({
      id: ri.id,
      ingredient_id: ri.ingredient_id,
      quantity: ri.quantity,
      unit: ri.unit,
      waste_factor_percent: ri.waste_factor_percent,
    })),
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Editar receta</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {receta.products?.name ?? ''}
        </p>
      </div>
      <RecetaForm
        products={products}
        ingredients={ingredients}
        prices={prices}
        action={updateReceta}
        defaultValues={defaultValues}
      />
    </div>
  )
}
