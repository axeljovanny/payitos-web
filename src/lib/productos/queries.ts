import { createClient } from '@/lib/supabase/server'
import type { ProductRow } from '@/lib/costing/types'

export type { ProductRow }

export interface ActiveRecipeSummary {
  id: string
  batch_yield: number
  cooking_type: string
  production_time_hours: number
  ingredient_count: number
}

export async function fetchProductos(): Promise<ProductRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select(
      'id, name, category, active, sale_price, target_margin_percent, default_batch_yield, production_time_hours, cooking_type'
    )
    .order('active', { ascending: false })
    .order('name')
  return (data ?? []) as ProductRow[]
}

export async function fetchProductoById(id: string): Promise<ProductRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select(
      'id, name, category, active, sale_price, target_margin_percent, default_batch_yield, production_time_hours, cooking_type'
    )
    .eq('id', id)
    .maybeSingle()
  return data as ProductRow | null
}

export async function fetchActiveRecipeForProduct(
  productId: string
): Promise<ActiveRecipeSummary | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('recipes')
    .select('id, batch_yield, cooking_type, production_time_hours, recipe_ingredients(id)')
    .eq('product_id', productId)
    .eq('active', true)
    .maybeSingle()

  if (!data) return null

  const raw = data as unknown as {
    id: string
    batch_yield: number
    cooking_type: string
    production_time_hours: number
    recipe_ingredients: { id: string }[]
  }

  return {
    id: raw.id,
    batch_yield: raw.batch_yield,
    cooking_type: raw.cooking_type,
    production_time_hours: raw.production_time_hours,
    ingredient_count: raw.recipe_ingredients?.length ?? 0,
  }
}
