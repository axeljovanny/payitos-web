import { fetchProductOptions, fetchIngredientOptions } from '@/lib/recetas/queries'
import { fetchLatestIngredientPrices } from '@/lib/ingredientes/queries'
import { createReceta } from '@/lib/recetas/actions'
import RecetaForm from '@/components/recetas/receta-form'

export default async function NuevaRecetaPage() {
  const [products, ingredients, prices] = await Promise.all([
    fetchProductOptions(),
    fetchIngredientOptions(),
    fetchLatestIngredientPrices(),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Nueva receta</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configura los ingredientes y parámetros de producción.
        </p>
      </div>
      <RecetaForm products={products} ingredients={ingredients} prices={prices} action={createReceta} />
    </div>
  )
}
