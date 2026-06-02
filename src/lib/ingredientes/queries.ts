import { createClient } from '@/lib/supabase/server'
import { convertUnit, calcLineCost } from '@/lib/costing/units'

export interface IngredienteListItem {
  id: string
  name: string
  base_unit: string
  active: boolean
  category_id: string | null
  supplier_name: string | null
  prep_recipe_id: string | null
  ingredient_categories: { name: string } | null
  unit_price: number | null
  presentation_name: string | null
  presentation_quantity: number | null
  presentation_unit: string | null
  purchase_price: number | null
  effective_from: string | null
}

export interface IngredienteDetail {
  id: string
  name: string
  base_unit: string
  active: boolean
  category_id: string | null
  supplier_name: string | null
  supplier_notes: string | null
  min_stock_target: number
  prep_recipe_id: string | null
  ingredient_categories: { name: string } | null
}

export interface PriceHistoryEntry {
  id: string
  ingredient_id: string
  presentation_name: string
  presentation_quantity: number
  presentation_unit: string
  purchase_price: number
  unit_price: number
  effective_from: string
}

export interface CategoryOption {
  id: string
  name: string
}

export interface IngredientPrice {
  unitPrice: number
  baseUnit: string
}

export async function fetchIngredientes(): Promise<IngredienteListItem[]> {
  const supabase = await createClient()

  const [{ data: priceHistory }, mainResult] = await Promise.all([
    supabase
      .from('ingredient_price_history')
      .select('ingredient_id, unit_price, presentation_name, presentation_quantity, presentation_unit, purchase_price, effective_from')
      .order('effective_from', { ascending: false }),
    // Try with prep_recipe_id; fall back if column doesn't exist yet
    supabase
      .from('ingredients')
      .select('id, name, base_unit, active, category_id, supplier_name, prep_recipe_id, ingredient_categories(name)')
      .order('active', { ascending: false })
      .order('name'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ingredients: any[] | null = mainResult.data
  if (mainResult.error) {
    // prep_recipe_id column not yet created — fall back to base query
    const { data: fallback } = await supabase
      .from('ingredients')
      .select('id, name, base_unit, active, category_id, supplier_name, ingredient_categories(name)')
      .order('active', { ascending: false })
      .order('name')
    ingredients = fallback
  }

  const priceMap = new Map<string, {
    unit_price: number
    presentation_name: string
    presentation_quantity: number
    presentation_unit: string
    purchase_price: number
    effective_from: string
  }>()

  priceHistory?.forEach((ph) => {
    if (!priceMap.has(ph.ingredient_id)) {
      priceMap.set(ph.ingredient_id, {
        unit_price: Number(ph.unit_price),
        presentation_name: ph.presentation_name,
        presentation_quantity: Number(ph.presentation_quantity),
        presentation_unit: ph.presentation_unit,
        purchase_price: Number(ph.purchase_price),
        effective_from: ph.effective_from,
      })
    }
  })

  return (ingredients ?? []).map((ing) => {
    const raw = ing as Record<string, unknown>
    const price = priceMap.get(raw.id as string)
    return {
      id: raw.id as string,
      name: raw.name as string,
      base_unit: raw.base_unit as string,
      active: raw.active as boolean,
      category_id: (raw.category_id as string | null) ?? null,
      supplier_name: (raw.supplier_name as string | null) ?? null,
      prep_recipe_id: (raw.prep_recipe_id as string | null) ?? null,
      ingredient_categories: raw.ingredient_categories as { name: string } | null,
      unit_price: price?.unit_price ?? null,
      presentation_name: price?.presentation_name ?? null,
      presentation_quantity: price?.presentation_quantity ?? null,
      presentation_unit: price?.presentation_unit ?? null,
      purchase_price: price?.purchase_price ?? null,
      effective_from: price?.effective_from ?? null,
    }
  })
}

export async function fetchIngredienteById(id: string): Promise<IngredienteDetail | null> {
  const supabase = await createClient()

  const result = await supabase
    .from('ingredients')
    .select('id, name, base_unit, active, category_id, supplier_name, supplier_notes, min_stock_target, prep_recipe_id, ingredient_categories(name)')
    .eq('id', id)
    .maybeSingle()

  if (result.error) {
    // Fallback without prep_recipe_id
    const { data } = await supabase
      .from('ingredients')
      .select('id, name, base_unit, active, category_id, supplier_name, supplier_notes, min_stock_target, ingredient_categories(name)')
      .eq('id', id)
      .maybeSingle()
    if (!data) return null
    return { ...(data as unknown as IngredienteDetail), prep_recipe_id: null }
  }

  return result.data as unknown as IngredienteDetail | null
}

export async function fetchPriceHistory(ingredientId: string): Promise<PriceHistoryEntry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ingredient_price_history')
    .select('id, ingredient_id, presentation_name, presentation_quantity, presentation_unit, purchase_price, unit_price, effective_from')
    .eq('ingredient_id', ingredientId)
    .order('effective_from', { ascending: false })
  return (data ?? []) as PriceHistoryEntry[]
}

export async function fetchCategoryOptions(): Promise<CategoryOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ingredient_categories')
    .select('id, name')
    .order('name')
  return (data ?? []) as CategoryOption[]
}

// Returns unit price map. For prep ingredients (prep_recipe_id), price is computed from the source recipe.
// Gracefully skips prep computation if the migration columns don't exist yet.
export async function fetchLatestIngredientPrices(): Promise<Record<string, IngredientPrice>> {
  const supabase = await createClient()

  const [ingredientsResult, { data: priceHistory }] = await Promise.all([
    supabase.from('ingredients').select('id, base_unit, prep_recipe_id').eq('active', true),
    supabase
      .from('ingredient_price_history')
      .select('ingredient_id, unit_price, effective_from')
      .order('effective_from', { ascending: false }),
  ])

  // If prep_recipe_id column doesn't exist, fall back to base fields only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ingredientsData: any[] | null = ingredientsResult.data
  if (ingredientsResult.error) {
    const { data: fallback } = await supabase
      .from('ingredients')
      .select('id, base_unit')
      .eq('active', true)
    ingredientsData = fallback
  }

  const baseUnitMap = new Map<string, string>()
  const prepRecipeMap = new Map<string, string>()

  ingredientsData?.forEach((i) => {
    const raw = i as Record<string, unknown>
    baseUnitMap.set(raw.id as string, raw.base_unit as string)
    const prepId = raw.prep_recipe_id as string | null | undefined
    if (prepId) prepRecipeMap.set(raw.id as string, prepId)
  })

  const result: Record<string, IngredientPrice> = {}

  priceHistory?.forEach((ph) => {
    if (!result[ph.ingredient_id] && !prepRecipeMap.has(ph.ingredient_id)) {
      result[ph.ingredient_id] = {
        unitPrice: Number(ph.unit_price),
        baseUnit: baseUnitMap.get(ph.ingredient_id) ?? 'g',
      }
    }
  })

  if (prepRecipeMap.size === 0) return result

  // Fetch source recipes for prep ingredients
  const recipeIds = [...new Set(prepRecipeMap.values())]
  const prepRecipesResult = await supabase
    .from('recipes')
    .select(`
      id, batch_yield, yield_unit,
      recipe_ingredients (
        ingredient_id, quantity, unit, waste_factor_percent,
        ingredients ( base_unit )
      )
    `)
    .in('id', recipeIds)
    .eq('active', true)

  // If yield_unit column doesn't exist, try without it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prepRecipes: any[] | null = prepRecipesResult.data
  if (prepRecipesResult.error) {
    const { data: fallback } = await supabase
      .from('recipes')
      .select(`
        id, batch_yield,
        recipe_ingredients (
          ingredient_id, quantity, unit, waste_factor_percent,
          ingredients ( base_unit )
        )
      `)
      .in('id', recipeIds)
      .eq('active', true)
    prepRecipes = fallback
  }

  for (const [ingId, recipeId] of prepRecipeMap) {
    const recipe = prepRecipes?.find((r) => r.id === recipeId) as {
      id: string
      batch_yield: number
      yield_unit?: string
      recipe_ingredients: Array<{
        ingredient_id: string
        quantity: number
        unit: string
        waste_factor_percent: number
        ingredients: { base_unit: string } | null
      }>
    } | undefined

    if (!recipe?.recipe_ingredients?.length) continue

    let batchCost = 0
    let valid = true

    for (const ri of recipe.recipe_ingredients) {
      const price = result[ri.ingredient_id]
      if (!price) { valid = false; break }
      const baseUnit = ri.ingredients?.base_unit ?? price.baseUnit
      const lineResult = calcLineCost(ri.quantity, ri.unit, ri.waste_factor_percent, price.unitPrice, baseUnit)
      if (!lineResult.ok) { valid = false; break }
      batchCost += lineResult.value
    }

    if (!valid || batchCost === 0) continue

    const baseUnit = baseUnitMap.get(ingId) ?? 'g'
    const yieldUnit = recipe.yield_unit ?? 'pza'
    const yieldConv = convertUnit(recipe.batch_yield, yieldUnit, baseUnit)
    if (!yieldConv.ok || yieldConv.value <= 0) continue

    result[ingId] = { unitPrice: batchCost / yieldConv.value, baseUnit }
  }

  return result
}
