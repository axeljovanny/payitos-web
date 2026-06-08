import { createClient } from '@/lib/supabase/server'
import type {
  CostBreakdown,
  ProductRow,
  IngredientCostLine,
  CostStatus,
  IngredientCategoryRow,
  TeamMemberRow,
  FixedCostRow,
  VariableExpenseRow,
  LaborCostContext,
  OverheadCostContext,
} from './types'
import { fetchActiveProcessDetails } from '@/lib/procesos/queries'
import { computeProcessCost, componentCost } from '@/lib/procesos/costing'
import type { ProcessDetail } from '@/lib/procesos/types'
import { fetchPrepsForCosting } from '@/lib/preparaciones/queries'
import { computePrepCosts, type PrepCost, type UnitPrice } from '@/lib/preparaciones/costing'
import { fetchLatestIngredientPrices } from '@/lib/ingredientes/queries'

// 20 días × 8h. Ajustar cuando exista tabla de configuración.
const MONTHLY_PRODUCTION_HOURS = 160

const PRODUCT_FIELDS =
  'id, name, category, active, sale_price, target_margin_percent, default_batch_yield, production_time_hours, cooking_type'

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

  const rates: number[] = []
  for (const m of members as Array<{ current_weekly_wage: number; production_hours_per_week: number; sales_hours_per_week: number }>) {
    const weekly = Number(m.current_weekly_wage)
    if (weekly <= 0) continue
    const hours = Number(m.production_hours_per_week) + Number(m.sales_hours_per_week)
    rates.push(weekly / (hours > 0 ? hours : 40))
  }
  if (!rates.length) return null
  const average_hourly_rate = rates.reduce((s, r) => s + r, 0) / rates.length
  return { average_hourly_rate }
}

export async function fetchOverheadCostContext(): Promise<OverheadCostContext | null> {
  const supabase = await createClient()
  const { data: fixedCosts } = await supabase
    .from('fixed_costs')
    .select('amount')
    .eq('active', true)

  const totalMonthlyFixed = (fixedCosts ?? []).reduce(
    (sum: number, fc: { amount: number }) => sum + Number(fc.amount), 0
  )
  if (totalMonthlyFixed === 0) return null

  return {
    fixed_cost_per_hour: totalMonthlyFixed / MONTHLY_PRODUCTION_HOURS,
    energy_cost_per_hour: 0,
  }
}

// ── Construcción de CostBreakdown desde un proceso ────────────────────────────

function emptyBreakdown(product: ProductRow): CostBreakdown {
  return {
    product, recipe: null, lines: [],
    batch_cost: null, cost_per_piece: null,
    labor_cost_per_piece: null, overhead_cost_per_piece: null, total_cost_per_piece: null,
    margin_percent: null, is_estimated: false, missing_prices: [], status: 'no_recipe',
  }
}

function buildBreakdownFromProcess(
  product: ProductRow,
  process: ProcessDetail,
  prices: Record<string, UnitPrice>,
  prepCosts: Map<string, PrepCost>,
  laborCtx: LaborCostContext | null,
  overheadCtx: OverheadCostContext | null,
): CostBreakdown {
  const overheadPerHour = overheadCtx ? overheadCtx.fixed_cost_per_hour + overheadCtx.energy_cost_per_hour : null

  const cost = computeProcessCost({
    outputs: process.outputs.map((o) => ({ product_id: o.product_id, pieces: o.pieces })),
    components: process.components.map((c) => ({
      label: c.label, source_type: c.source_type,
      ingredient_id: c.ingredient_id, preparation_id: c.preparation_id,
      quantity: c.quantity, unit: c.unit, waste_factor_percent: c.waste_factor_percent,
      allocation_mode: c.allocation_mode, consumers: c.consumers,
    })),
    laborHours: process.labor_hours_per_batch ?? 0,
    calendarHours: process.calendar_time_hours ?? 0,
    prices, prepCosts,
    hourlyLaborRate: laborCtx?.average_hourly_rate ?? null,
    overheadPerHour,
  })

  const output = process.outputs.find((o) => o.product_id === product.id)!
  const mine = cost.per_output.find((o) => o.product_id === product.id)
  const pieces = output.pieces

  // Líneas: cada componente que consume esta variante, con su costo asignado
  const lines: IngredientCostLine[] = []
  const missing: string[] = []
  for (const c of process.components) {
    // Porción por variante
    const weightByProduct = new Map<string, number>()
    if (c.allocation_mode === 'all') {
      for (const o of process.outputs) weightByProduct.set(o.product_id, 1)
    } else {
      for (const cc of c.consumers) weightByProduct.set(cc.product_id, cc.weight > 0 ? cc.weight : 1)
    }
    const myWeight = weightByProduct.get(product.id)
    if (!myWeight) continue
    const participating = process.outputs.reduce(
      (s, o) => s + (weightByProduct.has(o.product_id) ? o.pieces * weightByProduct.get(o.product_id)! : 0),
      0,
    )
    const { cost: compCost, ok } = componentCost(
      { label: c.label, source_type: c.source_type, ingredient_id: c.ingredient_id, preparation_id: c.preparation_id, quantity: c.quantity, unit: c.unit, waste_factor_percent: c.waste_factor_percent, allocation_mode: c.allocation_mode, consumers: c.consumers },
      prices, prepCosts,
    )
    const allocated = ok && participating > 0 ? compCost * ((pieces * myWeight) / participating) : null
    if (!ok) missing.push(c.label || 'componente')
    lines.push({
      ingredient_name: c.label || (c.source_type === 'preparation' ? 'Preparación' : 'Insumo'),
      quantity: c.quantity, unit: c.unit, waste_factor_percent: c.waste_factor_percent,
      unit_price: null, line_cost: allocated, unit_mismatch: !ok,
    })
  }

  const materialPP = mine && pieces > 0 ? mine.material_cost / pieces : null
  const laborPP = mine?.labor_cost != null && pieces > 0 ? mine.labor_cost / pieces : null
  const overheadPP = mine?.overhead_cost != null && pieces > 0 ? mine.overhead_cost / pieces : null
  const totalPP = mine?.total_cost != null && pieces > 0 ? mine.total_cost / pieces : materialPP

  const effectiveCost = totalPP ?? materialPP
  const marginPercent = effectiveCost != null && product.sale_price > 0
    ? ((product.sale_price - effectiveCost) / product.sale_price) * 100
    : null

  const isEstimated = missing.length > 0
  let status: CostStatus = 'ok'
  if (isEstimated) status = 'incomplete_prices'
  else if (effectiveCost != null && product.sale_price > 0 && effectiveCost > product.sale_price) status = 'price_insufficient'
  else if (marginPercent != null && marginPercent < product.target_margin_percent) status = 'margin_low'

  // recipe sintética para que la UI muestre rendimiento/tiempo/cocción
  const recipe = {
    id: process.id, product_id: product.id,
    batch_yield: pieces, yield_unit: 'pza',
    production_time_hours: process.calendar_time_hours ?? 0,
    cooking_type: process.cooking_type, active: process.active,
    recipe_ingredients: [],
    labor_hours_per_batch: process.labor_hours_per_batch,
    calendar_time_hours: process.calendar_time_hours,
  }

  return {
    product, recipe, lines,
    batch_cost: mine?.material_cost ?? null,
    cost_per_piece: materialPP,
    labor_cost_per_piece: laborPP,
    overhead_cost_per_piece: overheadPP,
    total_cost_per_piece: totalPP,
    margin_percent: marginPercent,
    is_estimated: isEstimated,
    missing_prices: [...new Set(missing)],
    status,
  }
}

// Construye el índice producto → proceso que lo produce (el primero activo)
function indexProductToProcess(processes: ProcessDetail[]): Map<string, ProcessDetail> {
  const map = new Map<string, ProcessDetail>()
  for (const proc of processes) {
    for (const o of proc.outputs) {
      if (!map.has(o.product_id)) map.set(o.product_id, proc)
    }
  }
  return map
}

async function loadCostingInputs() {
  const [prices, preps, laborCtx, overheadCtx, processes] = await Promise.all([
    fetchLatestIngredientPrices(),
    fetchPrepsForCosting(),
    fetchLaborCostContext(),
    fetchOverheadCostContext(),
    fetchActiveProcessDetails(),
  ])
  const prepCosts = computePrepCosts(preps, prices)
  return { prices, prepCosts, laborCtx, overheadCtx, processes }
}

// ── Breakdown queries ────────────────────────────────────────────────────────

export async function fetchCostBreakdowns(): Promise<CostBreakdown[]> {
  const supabase = await createClient()
  const { data: rawProducts } = await supabase
    .from('products').select(PRODUCT_FIELDS).eq('active', true).order('name')
  if (!rawProducts?.length) return []

  const products = rawProducts as ProductRow[]
  const { prices, prepCosts, laborCtx, overheadCtx, processes } = await loadCostingInputs()
  const index = indexProductToProcess(processes)

  return products.map((product) => {
    const proc = index.get(product.id)
    return proc
      ? buildBreakdownFromProcess(product, proc, prices, prepCosts, laborCtx, overheadCtx)
      : emptyBreakdown(product)
  })
}

export async function fetchProductCostById(productId: string): Promise<CostBreakdown | null> {
  const supabase = await createClient()
  const { data: rawProduct } = await supabase
    .from('products').select(PRODUCT_FIELDS).eq('id', productId).maybeSingle()
  if (!rawProduct) return null

  const product = rawProduct as ProductRow
  const { prices, prepCosts, laborCtx, overheadCtx, processes } = await loadCostingInputs()
  const proc = indexProductToProcess(processes).get(productId)

  return proc
    ? buildBreakdownFromProcess(product, proc, prices, prepCosts, laborCtx, overheadCtx)
    : emptyBreakdown(product)
}
