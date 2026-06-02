import { notFound } from 'next/navigation'
import { fetchProductoById } from '@/lib/productos/queries'
import { fetchRecetaByProductId, fetchIngredientOptions, fetchProductOptions } from '@/lib/recetas/queries'
import { fetchLatestIngredientPrices } from '@/lib/ingredientes/queries'
import { createReceta, updateReceta } from '@/lib/recetas/actions'
import RecetaForm from '@/components/recetas/receta-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductoRecetaPage({ params }: Props) {
  const { id } = await params

  const [product, recipe, products, ingredients, prices] = await Promise.all([
    fetchProductoById(id),
    fetchRecetaByProductId(id),
    fetchProductOptions(),
    fetchIngredientOptions(),
    fetchLatestIngredientPrices(),
  ])

  if (!product) notFound()

  const basePath = `/admin/productos/${id}`

  const defaultValues = recipe
    ? {
        id: recipe.id,
        product_id: recipe.product_id,
        batch_yield: recipe.batch_yield,
        production_time_hours: recipe.production_time_hours,
        cooking_type: recipe.cooking_type,
        ingredients: recipe.recipe_ingredients.map((ri) => ({
          id: ri.id,
          ingredient_id: ri.ingredient_id,
          quantity: ri.quantity,
          unit: ri.unit,
          waste_factor_percent: ri.waste_factor_percent,
        })),
      }
    : { product_id: id }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">
          {recipe ? 'Editar receta' : 'Nueva receta'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
      </div>
      <RecetaForm
        products={products}
        ingredients={ingredients}
        prices={prices}
        action={recipe ? updateReceta : createReceta}
        defaultValues={defaultValues}
        basePath={basePath}
      />
    </div>
  )
}
