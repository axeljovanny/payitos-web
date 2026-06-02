import { createClient } from '@/lib/supabase/server'
import type { IngredientRow } from '@/lib/costing/types'

export interface RecetaListItem {
  id: string
  product_id: string
  batch_yield: number
  yield_unit: string
  production_time_hours: number
  cooking_type: string
  active: boolean
  products: { name: string; category: string } | null
}

export interface RecetaDetail {
  id: string
  product_id: string
  batch_yield: number
  yield_unit: string
  production_time_hours: number
  cooking_type: string
  active: boolean
  products: { name: string; category: string } | null
  recipe_ingredients: Array<{
    id: string
    ingredient_id: string
    quantity: number
    unit: string
    waste_factor_percent: number
    ingredients: { id: string; name: string; base_unit: string } | null
  }>
}

export interface ProductOption {
  id: string
  name: string
  category: string
}

export interface PrepRecipeOption {
  id: string
  product_name: string
  batch_yield: number
  yield_unit: string
}

// Merge yield_unit from a separate query if the main query doesn't include it
function withYieldUnit<T extends { id: string }>(
  items: T[],
  yieldMap: Map<string, string>,
): (T & { yield_unit: string })[] {
  return items.map((item) => ({
    ...item,
    yield_unit: (item as Record<string, unknown>).yield_unit as string ?? yieldMap.get(item.id) ?? 'pza',
  }))
}

export async function fetchRecetas(): Promise<RecetaListItem[]> {
  const supabase = await createClient()

  const result = await supabase
    .from('recipes')
    .select('id, product_id, batch_yield, yield_unit, production_time_hours, cooking_type, active, products(name, category)')
    .order('active', { ascending: false })

  if (!result.error) return (result.data ?? []) as unknown as RecetaListItem[]

  // Fallback: yield_unit column doesn't exist yet
  const { data } = await supabase
    .from('recipes')
    .select('id, product_id, batch_yield, production_time_hours, cooking_type, active, products(name, category)')
    .order('active', { ascending: false })

  return ((data ?? []) as unknown as RecetaListItem[]).map((r) => ({ ...r, yield_unit: 'pza' }))
}

export async function fetchRecetaById(id: string): Promise<RecetaDetail | null> {
  const supabase = await createClient()

  const result = await supabase
    .from('recipes')
    .select(`
      id, product_id, batch_yield, yield_unit, production_time_hours, cooking_type, active,
      products ( name, category ),
      recipe_ingredients (
        id, ingredient_id, quantity, unit, waste_factor_percent,
        ingredients ( id, name, base_unit )
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (!result.error) return result.data as unknown as RecetaDetail | null

  // Fallback without yield_unit
  const { data } = await supabase
    .from('recipes')
    .select(`
      id, product_id, batch_yield, production_time_hours, cooking_type, active,
      products ( name, category ),
      recipe_ingredients (
        id, ingredient_id, quantity, unit, waste_factor_percent,
        ingredients ( id, name, base_unit )
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (!data) return null
  return { ...(data as unknown as RecetaDetail), yield_unit: 'pza' }
}

export async function fetchProductOptions(): Promise<ProductOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, category')
    .eq('active', true)
    .order('name')
  return (data ?? []) as ProductOption[]
}

export async function fetchIngredientOptions(): Promise<IngredientRow[]> {
  const supabase = await createClient()

  const result = await supabase
    .from('ingredients')
    .select('id, name, base_unit, prep_recipe_id')
    .order('name')

  if (!result.error) return (result.data ?? []) as IngredientRow[]

  // Fallback without prep_recipe_id
  const { data } = await supabase
    .from('ingredients')
    .select('id, name, base_unit')
    .order('name')
  return ((data ?? []) as IngredientRow[]).map((i) => ({ ...i, prep_recipe_id: null }))
}

export async function fetchRecetaByProductId(productId: string): Promise<RecetaDetail | null> {
  const supabase = await createClient()

  const result = await supabase
    .from('recipes')
    .select(`
      id, product_id, batch_yield, yield_unit, production_time_hours, cooking_type, active,
      products ( name, category ),
      recipe_ingredients (
        id, ingredient_id, quantity, unit, waste_factor_percent,
        ingredients ( id, name, base_unit )
      )
    `)
    .eq('product_id', productId)
    .maybeSingle()

  if (!result.error) return result.data as unknown as RecetaDetail | null

  const { data } = await supabase
    .from('recipes')
    .select(`
      id, product_id, batch_yield, production_time_hours, cooking_type, active,
      products ( name, category ),
      recipe_ingredients (
        id, ingredient_id, quantity, unit, waste_factor_percent,
        ingredients ( id, name, base_unit )
      )
    `)
    .eq('product_id', productId)
    .maybeSingle()

  if (!data) return null
  return { ...(data as unknown as RecetaDetail), yield_unit: 'pza' }
}

export async function fetchRecipesForPrepSelector(): Promise<PrepRecipeOption[]> {
  const supabase = await createClient()

  const result = await supabase
    .from('recipes')
    .select('id, batch_yield, yield_unit, products(name)')
    .eq('active', true)
    .order('id')

  let data = result.data
  if (result.error) {
    // yield_unit doesn't exist yet
    const fallback = await supabase
      .from('recipes')
      .select('id, batch_yield, products(name)')
      .eq('active', true)
      .order('id')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data = fallback.data as any
  }

  return ((data ?? []) as unknown as Array<{
    id: string
    batch_yield: number
    yield_unit?: string
    products: { name: string } | null
  }>).map((r) => ({
    id: r.id,
    product_name: r.products?.name ?? '(sin producto)',
    batch_yield: r.batch_yield,
    yield_unit: r.yield_unit ?? 'pza',
  }))
}

// Keep unused withYieldUnit from complaining
void withYieldUnit
