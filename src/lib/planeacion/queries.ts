import { createClient } from '@/lib/supabase/server'
import type {
  WeeklyPlanRow,
  WeeklyPlanItemRow,
  ProductForPlan,
  SpecialOrdersByDay,
  SpecialOrderLine,
  WeeklyPlanIngredientResult,
  IngredientRequirement,
} from './types'

// ── Date helpers ─────────────────────────────────────────────────────────────

export function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

export function getMondayISO(dateISO: string): string {
  const d = new Date(dateISO + 'T12:00:00Z')
  const jsDay = d.getUTCDay() // 0=Sun
  const offset = jsDay === 0 ? -6 : 1 - jsDay
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().split('T')[0]
}

export function dayOfWeekISO(dateISO: string): number {
  const jsDay = new Date(dateISO + 'T12:00:00Z').getUTCDay()
  return jsDay === 0 ? 7 : jsDay
}

export function formatWeekLabel(weekStart: string): string {
  const weekEnd = addDays(weekStart, 6)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' }
  const start = new Date(weekStart + 'T12:00:00Z').toLocaleDateString('es-MX', opts)
  const end = new Date(weekEnd + 'T12:00:00Z').toLocaleDateString('es-MX', opts)
  const year = weekStart.slice(0, 4)
  return `${start} – ${end}, ${year}`
}

// ── Plan list ─────────────────────────────────────────────────────────────────

export async function listWeeklyPlans(): Promise<WeeklyPlanRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('weekly_plans')
    .select('id, week_start, status, notes, created_by, created_at')
    .order('week_start', { ascending: false })
  return (data ?? []) as WeeklyPlanRow[]
}

// ── Plan detail ───────────────────────────────────────────────────────────────

export async function getWeeklyPlanById(id: string): Promise<{
  plan: WeeklyPlanRow
  items: WeeklyPlanItemRow[]
} | null> {
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('weekly_plans')
    .select('id, week_start, status, notes, created_by, created_at')
    .eq('id', id)
    .maybeSingle()

  if (!plan) return null

  const { data: items } = await supabase
    .from('weekly_plan_items')
    .select('id, plan_id, product_id, day_of_week, quantity_planned, products(name, category)')
    .eq('plan_id', id)
    .order('day_of_week')

  return {
    plan: plan as WeeklyPlanRow,
    items: (items ?? []) as unknown as WeeklyPlanItemRow[],
  }
}

// ── Products available for planning ──────────────────────────────────────────

export async function getProductsForPlan(): Promise<ProductForPlan[]> {
  const supabase = await createClient()

  const [{ data: products }, { data: recipes }] = await Promise.all([
    supabase.from('products').select('id, name, category').eq('active', true).order('name'),
    supabase.from('recipes').select('id, product_id, batch_yield').eq('active', true),
  ])

  const recipeMap = new Map(
    ((recipes ?? []) as Array<{ id: string; product_id: string; batch_yield: number }>).map(
      (r) => [r.product_id, { id: r.id, batch_yield: r.batch_yield }]
    )
  )

  return (
    (products ?? []) as Array<{ id: string; name: string; category: string }>
  ).map((p) => {
    const recipe = recipeMap.get(p.id)
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      has_recipe: !!recipe,
      recipe_id: recipe?.id ?? null,
      batch_yield: recipe?.batch_yield ?? null,
    }
  })
}

// ── Special orders for a week ─────────────────────────────────────────────────

export async function getWeeklyPlanSpecialOrders(weekStart: string): Promise<SpecialOrdersByDay> {
  const weekEnd = addDays(weekStart, 6)
  const supabase = await createClient()

  const { data } = await supabase
    .from('special_orders')
    .select(
      `id, customer_name, delivery_date,
       special_order_items ( id, product_id, product_name, quantity )`
    )
    .gte('delivery_date', weekStart)
    .lte('delivery_date', weekEnd)
    .neq('status', 'delivered')
    .neq('status', 'cancelled')
    .order('delivery_date')

  const byDay: SpecialOrdersByDay = {}

  for (const order of (data ?? []) as Array<{
    id: string
    customer_name: string
    delivery_date: string
    special_order_items: Array<{
      id: string
      product_id: string | null
      product_name: string
      quantity: number
    }>
  }>) {
    const dow = dayOfWeekISO(order.delivery_date)
    if (!byDay[dow]) byDay[dow] = []

    for (const item of order.special_order_items ?? []) {
      const line: SpecialOrderLine = {
        order_id: order.id,
        customer_name: order.customer_name,
        delivery_date: order.delivery_date,
        day_of_week: dow,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
      }
      byDay[dow].push(line)
    }
  }

  return byDay
}

// ── Ingredient requirements ───────────────────────────────────────────────────

export async function getWeeklyPlanIngredientRequirements(
  planId: string
): Promise<WeeklyPlanIngredientResult> {
  const empty: WeeklyPlanIngredientResult = {
    requirements: [],
    products_without_recipe: [],
    products_without_ingredients: [],
    shopping_list: [],
  }

  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('weekly_plans')
    .select('id, week_start')
    .eq('id', planId)
    .maybeSingle()

  if (!plan) return empty

  const weekEnd = addDays((plan as { week_start: string }).week_start, 6)

  const [
    { data: planItems },
    { data: specialOrders },
    { data: recipes },
    { data: stock },
  ] = await Promise.all([
    supabase
      .from('weekly_plan_items')
      .select('product_id, quantity_planned, products(name)')
      .eq('plan_id', planId),
    supabase
      .from('special_orders')
      .select(
        `delivery_date,
         special_order_items ( product_id, product_name, quantity )`
      )
      .gte('delivery_date', (plan as { week_start: string }).week_start)
      .lte('delivery_date', weekEnd)
      .neq('status', 'delivered')
      .neq('status', 'cancelled'),
    supabase
      .from('recipes')
      .select(
        `id, product_id, batch_yield,
         recipe_ingredients (
           ingredient_id, quantity, unit, waste_factor_percent,
           ingredients ( id, name, base_unit )
         )`
      )
      .eq('active', true),
    supabase.from('ingredient_stock').select('ingredient_id, quantity'),
  ])

  // 1. Accumulate total pieces per product (plan items + special orders)
  const totalByProduct = new Map<string, { name: string; qty: number }>()

  for (const item of (planItems ?? []) as unknown as Array<{
    product_id: string
    quantity_planned: number
    products: { name: string } | null
  }>) {
    const prev = totalByProduct.get(item.product_id)
    totalByProduct.set(item.product_id, {
      name: item.products?.name ?? item.product_id,
      qty: (prev?.qty ?? 0) + item.quantity_planned,
    })
  }

  for (const order of (specialOrders ?? []) as Array<{
    delivery_date: string
    special_order_items: Array<{ product_id: string | null; product_name: string; quantity: number }>
  }>) {
    for (const soi of order.special_order_items ?? []) {
      if (!soi.product_id) continue
      const prev = totalByProduct.get(soi.product_id)
      totalByProduct.set(soi.product_id, {
        name: soi.product_name,
        qty: (prev?.qty ?? 0) + soi.quantity,
      })
    }
  }

  // 2. Recipe map: product_id → recipe with ingredients
  const recipeMap = new Map(
    ((recipes ?? []) as unknown as Array<{
      id: string
      product_id: string
      batch_yield: number
      recipe_ingredients: Array<{
        ingredient_id: string
        quantity: number
        unit: string
        waste_factor_percent: number
        ingredients: { id: string; name: string; base_unit: string } | null
      }>
    }>).map((r) => [r.product_id, r])
  )

  // 3. Stock map: ingredient_id → summed quantity
  const stockMap = new Map<string, number>()
  for (const row of (stock ?? []) as Array<{ ingredient_id: string; quantity: number }>) {
    stockMap.set(row.ingredient_id, (stockMap.get(row.ingredient_id) ?? 0) + row.quantity)
  }

  // 4. Calculate ingredient requirements
  const products_without_recipe: string[] = []
  const products_without_ingredients: string[] = []
  const ingRequired = new Map<string, { name: string; unit: string; qty: number }>()

  for (const [productId, { name, qty }] of totalByProduct) {
    if (qty <= 0) continue
    const recipe = recipeMap.get(productId)
    if (!recipe) {
      products_without_recipe.push(name)
      continue
    }
    const recipeIngs = recipe.recipe_ingredients ?? []
    if (recipeIngs.length === 0) {
      products_without_ingredients.push(name)
      continue
    }

    const batches = Math.ceil(qty / recipe.batch_yield)

    for (const ri of recipeIngs) {
      if (!ri.ingredients) continue
      const wasteMult = 1 + (ri.waste_factor_percent ?? 0) / 100
      const needed = ri.quantity * batches * wasteMult
      const prev = ingRequired.get(ri.ingredient_id)
      ingRequired.set(ri.ingredient_id, {
        name: ri.ingredients.name,
        unit: ri.ingredients.base_unit,
        qty: (prev?.qty ?? 0) + needed,
      })
    }
  }

  // 5. Build final requirements list
  const requirements: IngredientRequirement[] = []
  for (const [ingId, { name, unit, qty }] of ingRequired) {
    const currentStock = stockMap.get(ingId) ?? 0
    const shortage = Math.max(0, qty - currentStock)
    requirements.push({
      ingredient_id: ingId,
      ingredient_name: name,
      unit,
      required_quantity: Math.round(qty * 100) / 100,
      current_stock: Math.round(currentStock * 100) / 100,
      shortage: Math.round(shortage * 100) / 100,
    })
  }

  requirements.sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name, 'es'))

  return {
    requirements,
    products_without_recipe,
    products_without_ingredients,
    shopping_list: requirements.filter((r) => r.shortage > 0),
  }
}
