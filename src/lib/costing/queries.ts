import { createClient } from '@/lib/supabase/server'
import { calculateCost } from './calculator'
import { convertUnit } from './units'
import type {
  CostBreakdown,
  ProductRow,
  RecipeRow,
  IngredientCategoryRow,
  TeamMemberRow,
  FixedCostRow,
  VariableExpenseRow,
  LaborCostContext,
  OverheadCostContext,
} from './types'

// Estimated monthly production hours used to amortize fixed costs per production hour.
// 20 working days × 8 hours. Adjust once a config table exists.
const MONTHLY_PRODUCTION_HOURS = 160

const PRODUCT_FIELDS =
  'id, name, category, active, sale_price, target_margin_percent, default_batch_yield, production_time_hours, cooking_type'

const RECIPE_FIELDS = `
  id, product_id, batch_yield, yield_unit, production_time_hours, cooking_type, active,
  recipe_ingredients (
    id, ingredient_id, quantity, unit, waste_factor_percent,
    ingredients ( id, name, base_unit, prep_recipe_id )
  )
`

const RECIPE_FIELDS_FALLBACK = `
  id, product_id, batch_yield, production_time_hours, cooking_type, active,
  recipe_ingredients (
    id, ingredient_id, quantity, unit, waste_factor_percent,
    ingredients ( id, name, base_unit )
  )
`

// Resolves ingredient prices from price history + prep recipe computation.
async function resolveIngredientPrices(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ingredientIds: string[],
): Promise<Map<string, number>> {
  if (!ingredientIds.length) return new Map()

  const ingResult = await supabase
    .from('ingredients')
    .select('id, base_unit, prep_recipe_id')
    .in('id', ingredientIds)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ingredientsData: any[] | null = ingResult.data
  if (ingResult.error) {
    const { data: fallback } = await supabase
      .from('ingredients')
      .select('id, base_unit')
      .in('id', ingredientIds)
    ingredientsData = fallback
  }

  const { data: priceHistory } = await supabase
    .from('ingredient_price_history')
    .select('ingredient_id, unit_price, effective_from')
    .in('ingredient_id', ingredientIds)
    .order('effective_from', { ascending: false })

  const baseUnitMap = new Map<string, string>()
  const prepRecipeMap = new Map<string, string>()
  ingredientsData?.forEach((i: { id: string; base_unit: string; prep_recipe_id?: string | null }) => {
    baseUnitMap.set(i.id, i.base_unit)
    if (i.prep_recipe_id) prepRecipeMap.set(i.id, i.prep_recipe_id)
  })

  const result = new Map<string, number>()
  priceHistory?.forEach((ph: { ingredient_id: string; unit_price: number }) => {
    if (!result.has(ph.ingredient_id) && !prepRecipeMap.has(ph.ingredient_id)) {
      result.set(ph.ingredient_id, Number(ph.unit_price))
    }
  })

  if (prepRecipeMap.size === 0) return result

  // Fetch source recipes for prep ingredients
  const recipeIds = [...new Set(prepRecipeMap.values())]
  const { data: prepRecipes } = await supabase
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

  // Fetch prices for ingredients INSIDE prep recipes (one extra level only)
  const innerIds = new Set<string>()
  prepRecipes?.forEach((r: { recipe_ingredients: Array<{ ingredient_id: string }> }) => {
    r.recipe_ingredients?.forEach((ri) => innerIds.add(ri.ingredient_id))
  })

  if (innerIds.size > 0) {
    const { data: innerHistory } = await supabase
      .from('ingredient_price_history')
      .select('ingredient_id, unit_price, effective_from')
      .in('ingredient_id', [...innerIds])
      .order('effective_from', { ascending: false })

    innerHistory?.forEach((ph: { ingredient_id: string; unit_price: number }) => {
      if (!result.has(ph.ingredient_id)) {
        result.set(ph.ingredient_id, Number(ph.unit_price))
      }
    })
  }

  // Compute each prep ingredient's unit price from its source recipe
  for (const [ingId, recipeId] of prepRecipeMap) {
    const recipe = prepRecipes?.find((r: { id: string }) => r.id === recipeId) as {
      id: string
      batch_yield: number
      yield_unit: string
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
      const unitPrice = result.get(ri.ingredient_id)
      if (unitPrice === undefined) { valid = false; break }
      const baseUnit = ri.ingredients?.base_unit ?? ri.unit
      const conv = convertUnit(ri.quantity, ri.unit, baseUnit)
      if (!conv.ok) { valid = false; break }
      batchCost += conv.value * (1 + ri.waste_factor_percent / 100) * unitPrice
    }

    if (!valid || batchCost === 0) continue

    const baseUnit = baseUnitMap.get(ingId) ?? 'g'
    const yieldConv = convertUnit(recipe.batch_yield, recipe.yield_unit ?? 'pza', baseUnit)
    if (!yieldConv.ok || yieldConv.value <= 0) continue

    result.set(ingId, batchCost / yieldConv.value)
  }

  return result
}

// ── Reference data ───────────────────────────────────────────────────────────

export async function fetchIngredientCategories(): Promise<IngredientCategoryRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ingredient_categories')
    .select('id, name, description')
    .order('name')
  return (data ?? []) as IngredientCategoryRow[]
}

export async function fetchTeamMembers(): Promise<TeamMemberRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('team_members')
    .select('id, full_name, role_type, active, current_weekly_wage, production_hours_per_week, sales_hours_per_week')
    .eq('active', true)
    .order('full_name')
  return (data ?? []) as TeamMemberRow[]
}

export async function fetchFixedCosts(): Promise<FixedCostRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fixed_costs')
    .select('id, name, category, amount, active')
    .eq('active', true)
    .order('category, name')
  return (data ?? []) as FixedCostRow[]
}

export async function fetchVariableExpenses(): Promise<VariableExpenseRow[]> {
  // variable_expenses is a transactional ledger (expense_date, description, amount)
  // — it has no amount_per_hour / amount_fixed overhead rate columns.
  // Overhead from variable expenses is excluded from the cost engine until
  // the rate model is defined.
  return []
}

// ── Cost engine contexts ─────────────────────────────────────────────────────

export async function fetchLaborCostContext(): Promise<LaborCostContext | null> {
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from('team_members')
    .select('current_weekly_wage, production_hours_per_week, sales_hours_per_week')
    .eq('active', true)

  if (error || !members?.length) return null

  // Derive hourly rate: weekly_wage / total_hours_per_week
  const rates: number[] = []
  for (const m of members as Array<{ current_weekly_wage: number; production_hours_per_week: number; sales_hours_per_week: number }>) {
    const weekly = Number(m.current_weekly_wage)
    if (weekly <= 0) continue
    const hours = Number(m.production_hours_per_week) + Number(m.sales_hours_per_week)
    rates.push(weekly / (hours > 0 ? hours : 40))
  }

  if (!rates.length) return null
  const average_hourly_rate = rates.reduce((sum, r) => sum + r, 0) / rates.length
  return { average_hourly_rate }
}

export async function fetchOverheadCostContext(): Promise<OverheadCostContext | null> {
  const supabase = await createClient()

  const { data: fixedCosts } = await supabase
    .from('fixed_costs')
    .select('amount')
    .eq('active', true)

  const totalMonthlyFixed = (fixedCosts ?? []).reduce(
    (sum: number, fc: { amount: number }) => sum + Number(fc.amount),
    0
  )
  // variable_expenses is a ledger table — no per-hour overhead rates available
  const totalEnergyPerHour = ([] as Array<{ amount_per_hour: number | null }>).reduce(
    (sum: number, ve: { amount_per_hour: number | null }) =>
      sum + Number(ve.amount_per_hour ?? 0),
    0
  )

  if (totalMonthlyFixed === 0 && totalEnergyPerHour === 0) return null

  return {
    fixed_cost_per_hour: totalMonthlyFixed / MONTHLY_PRODUCTION_HOURS,
    energy_cost_per_hour: totalEnergyPerHour,
  }
}

// ── Breakdown queries ────────────────────────────────────────────────────────

export async function fetchCostBreakdowns(): Promise<CostBreakdown[]> {
  const supabase = await createClient()

  const { data: rawProducts } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .eq('active', true)
    .order('name')

  if (!rawProducts?.length) return []

  const products = rawProducts as ProductRow[]
  const productIds = products.map((p) => p.id)

  const recipesResult = await supabase
    .from('recipes')
    .select(RECIPE_FIELDS)
    .in('product_id', productIds)
    .eq('active', true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawRecipes: any[] | null = recipesResult.data
  if (recipesResult.error) {
    const { data: fallback } = await supabase
      .from('recipes')
      .select(RECIPE_FIELDS_FALLBACK)
      .in('product_id', productIds)
      .eq('active', true)
    rawRecipes = fallback
  }

  const recipes = ((rawRecipes ?? []) as unknown as RecipeRow[]).map((r) => ({
    ...r,
    yield_unit: r.yield_unit ?? 'pza',
  }))

  const ingredientIds = new Set<string>()
  recipes.forEach((r) => r.recipe_ingredients?.forEach((ri) => ingredientIds.add(ri.ingredient_id)))

  const latestPrices = await resolveIngredientPrices(supabase, [...ingredientIds])

  const [laborCtx, overheadCtx] = await Promise.all([
    fetchLaborCostContext(),
    fetchOverheadCostContext(),
  ])

  const recipeByProductId = new Map(recipes.map((r) => [r.product_id, r]))

  return products.map((product) =>
    calculateCost(
      product,
      recipeByProductId.get(product.id) ?? null,
      latestPrices,
      laborCtx,
      overheadCtx,
    )
  )
}

export async function fetchProductCostById(productId: string): Promise<CostBreakdown | null> {
  const supabase = await createClient()

  const { data: rawProduct } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .eq('id', productId)
    .maybeSingle()

  if (!rawProduct) return null

  const product = rawProduct as ProductRow

  const recipeResult = await supabase
    .from('recipes')
    .select(RECIPE_FIELDS)
    .eq('product_id', productId)
    .eq('active', true)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawRecipe: any | null = recipeResult.data
  if (recipeResult.error) {
    const { data: fallback } = await supabase
      .from('recipes')
      .select(RECIPE_FIELDS_FALLBACK)
      .eq('product_id', productId)
      .eq('active', true)
      .maybeSingle()
    rawRecipe = fallback
  }

  const recipe = rawRecipe
    ? { ...(rawRecipe as unknown as RecipeRow), yield_unit: (rawRecipe as Record<string, unknown>).yield_unit as string ?? 'pza' }
    : null
  const ingredientIds = recipe?.recipe_ingredients?.map((ri) => ri.ingredient_id) ?? []
  const latestPrices = await resolveIngredientPrices(supabase, ingredientIds)

  const [laborCtx, overheadCtx] = await Promise.all([
    fetchLaborCostContext(),
    fetchOverheadCostContext(),
  ])

  return calculateCost(product, recipe, latestPrices, laborCtx, overheadCtx)
}
