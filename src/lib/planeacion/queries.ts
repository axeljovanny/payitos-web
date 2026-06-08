import { createClient } from '@/lib/supabase/server'
import { fetchActiveProcessDetails } from '@/lib/procesos/queries'
import { fetchPrepsForCosting } from '@/lib/preparaciones/queries'
import { explodeProcessPerRun, type PrepDef } from '@/lib/procesos/explosion'
import type { ProcessDetail } from '@/lib/procesos/types'
import type {
  WeeklyPlanRow,
  WeeklyPlanItemRow,
  ProductForPlan,
  SpecialOrdersByDay,
  SpecialOrderLine,
  WeeklyPlanIngredientResult,
  IngredientRequirement,
  WeekCapacitySummary,
  DayCapacitySummary,
} from './types'

// ── Date helpers ─────────────────────────────────────────────────────────────

export function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

export function getMondayISO(dateISO: string): string {
  const d = new Date(dateISO + 'T12:00:00Z')
  const jsDay = d.getUTCDay()
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

// ── Plan list / detail ─────────────────────────────────────────────────────────

export async function listWeeklyPlans(): Promise<WeeklyPlanRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('weekly_plans')
    .select('id, week_start, status, notes, created_by, created_at')
    .order('week_start', { ascending: false })
  return (data ?? []) as WeeklyPlanRow[]
}

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

  return { plan: plan as WeeklyPlanRow, items: (items ?? []) as unknown as WeeklyPlanItemRow[] }
}

// ── Índice producto → proceso que lo produce ──────────────────────────────────

interface ProcessHit { process: ProcessDetail; pieces: number }

function indexProductToProcess(processes: ProcessDetail[]): Map<string, ProcessHit> {
  const map = new Map<string, ProcessHit>()
  for (const proc of processes) {
    for (const o of proc.outputs) {
      if (!map.has(o.product_id)) map.set(o.product_id, { process: proc, pieces: o.pieces })
    }
  }
  return map
}

// Dado un mapa de piezas planeadas por producto, calcula nº de corridas por proceso.
function computeProcessRuns(
  piecesByProduct: Map<string, { name: string; qty: number }>,
  processes: ProcessDetail[],
): { runsByProcess: Map<string, number>; productsWithoutProcess: string[] } {
  const index = indexProductToProcess(processes)
  const ratioByProcess = new Map<string, number>()
  const consumed = new Set<string>()

  for (const [productId, { qty }] of piecesByProduct) {
    if (qty <= 0) continue
    const hit = index.get(productId)
    if (!hit) continue
    consumed.add(productId)
    const ratio = hit.pieces > 0 ? qty / hit.pieces : 0
    const prev = ratioByProcess.get(hit.process.id) ?? 0
    ratioByProcess.set(hit.process.id, Math.max(prev, ratio))
  }

  const runsByProcess = new Map<string, number>()
  for (const [pid, ratio] of ratioByProcess) runsByProcess.set(pid, Math.ceil(ratio))

  const productsWithoutProcess: string[] = []
  for (const [productId, { name, qty }] of piecesByProduct) {
    if (qty > 0 && !consumed.has(productId)) productsWithoutProcess.push(name)
  }

  return { runsByProcess, productsWithoutProcess }
}

// ── Products available for planning ──────────────────────────────────────────

export async function getProductsForPlan(): Promise<ProductForPlan[]> {
  const supabase = await createClient()
  const [{ data: products }, processes] = await Promise.all([
    supabase.from('products').select('id, name, category').eq('active', true).order('name'),
    fetchActiveProcessDetails(),
  ])
  const index = indexProductToProcess(processes)

  return ((products ?? []) as Array<{ id: string; name: string; category: string }>).map((p) => {
    const hit = index.get(p.id)
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      has_recipe: !!hit,
      recipe_id: hit?.process.id ?? null,
      batch_yield: hit?.pieces ?? null,
      labor_hours_per_batch: hit?.process.labor_hours_per_batch ?? null,
      calendar_time_hours: hit?.process.calendar_time_hours ?? null,
    }
  })
}

// ── Special orders for a week ─────────────────────────────────────────────────

export async function getWeeklyPlanSpecialOrders(weekStart: string): Promise<SpecialOrdersByDay> {
  const weekEnd = addDays(weekStart, 6)
  const supabase = await createClient()
  const { data } = await supabase
    .from('special_orders')
    .select(`id, customer_name, delivery_date, special_order_items ( id, product_id, product_name, quantity )`)
    .gte('delivery_date', weekStart)
    .lte('delivery_date', weekEnd)
    .neq('status', 'delivered')
    .neq('status', 'cancelled')
    .order('delivery_date')

  const byDay: SpecialOrdersByDay = {}
  for (const order of (data ?? []) as Array<{
    id: string; customer_name: string; delivery_date: string
    special_order_items: Array<{ id: string; product_id: string | null; product_name: string; quantity: number }>
  }>) {
    const dow = dayOfWeekISO(order.delivery_date)
    if (!byDay[dow]) byDay[dow] = []
    for (const item of order.special_order_items ?? []) {
      const line: SpecialOrderLine = {
        order_id: order.id, customer_name: order.customer_name, delivery_date: order.delivery_date,
        day_of_week: dow, product_id: item.product_id, product_name: item.product_name, quantity: item.quantity,
      }
      byDay[dow].push(line)
    }
  }
  return byDay
}

// ── Maps de insumos para explosión ────────────────────────────────────────────

async function buildExplosionMaps() {
  const supabase = await createClient()
  const [{ data: ingredients }, preps] = await Promise.all([
    supabase.from('ingredients').select('id, name, base_unit'),
    fetchPrepsForCosting(),
  ])

  const ingredientBaseUnit = new Map<string, string>()
  const ingredientName = new Map<string, string>()
  for (const i of (ingredients ?? []) as Array<{ id: string; name: string; base_unit: string }>) {
    ingredientBaseUnit.set(i.id, i.base_unit)
    ingredientName.set(i.id, i.name)
  }

  const prepsById = new Map<string, PrepDef>()
  for (const p of preps) prepsById.set(p.id, p)

  return { ingredientBaseUnit, ingredientName, prepsById }
}

// ── Ingredient requirements (lista de compras) ────────────────────────────────

export async function getWeeklyPlanIngredientRequirements(
  planId: string
): Promise<WeeklyPlanIngredientResult> {
  const empty: WeeklyPlanIngredientResult = {
    requirements: [], products_without_recipe: [], products_without_ingredients: [], shopping_list: [],
  }
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('weekly_plans').select('id, week_start').eq('id', planId).maybeSingle()
  if (!plan) return empty
  const weekEnd = addDays((plan as { week_start: string }).week_start, 6)

  const [{ data: planItems }, { data: specialOrders }, { data: stock }, processes, maps] = await Promise.all([
    supabase.from('weekly_plan_items').select('product_id, quantity_planned, products(name)').eq('plan_id', planId),
    supabase
      .from('special_orders')
      .select(`delivery_date, special_order_items ( product_id, product_name, quantity )`)
      .gte('delivery_date', (plan as { week_start: string }).week_start)
      .lte('delivery_date', weekEnd)
      .neq('status', 'delivered').neq('status', 'cancelled'),
    supabase.from('ingredient_stock').select('ingredient_id, quantity'),
    fetchActiveProcessDetails(),
    buildExplosionMaps(),
  ])

  // 1. piezas por producto
  const totalByProduct = new Map<string, { name: string; qty: number }>()
  for (const item of (planItems ?? []) as unknown as Array<{ product_id: string; quantity_planned: number; products: { name: string } | null }>) {
    const prev = totalByProduct.get(item.product_id)
    totalByProduct.set(item.product_id, { name: item.products?.name ?? item.product_id, qty: (prev?.qty ?? 0) + item.quantity_planned })
  }
  for (const order of (specialOrders ?? []) as Array<{ delivery_date: string; special_order_items: Array<{ product_id: string | null; product_name: string; quantity: number }> }>) {
    for (const soi of order.special_order_items ?? []) {
      if (!soi.product_id) continue
      const prev = totalByProduct.get(soi.product_id)
      totalByProduct.set(soi.product_id, { name: soi.product_name, qty: (prev?.qty ?? 0) + soi.quantity })
    }
  }

  // 2. corridas por proceso
  const { runsByProcess, productsWithoutProcess } = computeProcessRuns(totalByProduct, processes)

  // 3. explosión a insumos × corridas
  const ingRequired = new Map<string, { name: string; unit: string; qty: number }>()
  const processById = new Map(processes.map((p) => [p.id, p]))
  const products_without_ingredients: string[] = []

  for (const [processId, runs] of runsByProcess) {
    if (runs <= 0) continue
    const proc = processById.get(processId)
    if (!proc) continue
    const exploded = explodeProcessPerRun(
      proc.components.map((c) => ({
        source_type: c.source_type, ingredient_id: c.ingredient_id, preparation_id: c.preparation_id,
        quantity: c.quantity, unit: c.unit, waste_factor_percent: c.waste_factor_percent,
      })),
      maps,
    )
    if (exploded.length === 0) products_without_ingredients.push(proc.name)
    for (const ing of exploded) {
      const prev = ingRequired.get(ing.ingredient_id)
      ingRequired.set(ing.ingredient_id, {
        name: ing.name, unit: ing.unit, qty: (prev?.qty ?? 0) + ing.quantity * runs,
      })
    }
  }

  // 4. stock
  const stockMap = new Map<string, number>()
  for (const row of (stock ?? []) as Array<{ ingredient_id: string; quantity: number }>) {
    stockMap.set(row.ingredient_id, (stockMap.get(row.ingredient_id) ?? 0) + row.quantity)
  }

  // 5. requerimientos
  const requirements: IngredientRequirement[] = []
  for (const [ingId, { name, unit, qty }] of ingRequired) {
    const currentStock = stockMap.get(ingId) ?? 0
    const shortage = Math.max(0, qty - currentStock)
    requirements.push({
      ingredient_id: ingId, ingredient_name: name, unit,
      required_quantity: Math.round(qty * 100) / 100,
      current_stock: Math.round(currentStock * 100) / 100,
      shortage: Math.round(shortage * 100) / 100,
    })
  }
  requirements.sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name, 'es'))

  return {
    requirements,
    products_without_recipe: productsWithoutProcess,
    products_without_ingredients,
    shopping_list: requirements.filter((r) => r.shortage > 0),
  }
}

// ── Capacity summary ──────────────────────────────────────────────────────────

export async function getWeeklyPlanCapacity(planId: string): Promise<WeekCapacitySummary | null> {
  const supabase = await createClient()
  const { data: plan } = await supabase
    .from('weekly_plans').select('id, week_start').eq('id', planId).maybeSingle()
  if (!plan) return null
  const weekStart = (plan as { week_start: string }).week_start
  const weekEnd = addDays(weekStart, 6)

  const [{ data: planItems }, { data: specialOrders }, processes, { data: teamMembers }] = await Promise.all([
    supabase.from('weekly_plan_items').select('product_id, day_of_week, quantity_planned, products(name)').eq('plan_id', planId),
    supabase
      .from('special_orders')
      .select('delivery_date, special_order_items(product_id, product_name, quantity)')
      .gte('delivery_date', weekStart).lte('delivery_date', weekEnd)
      .neq('status', 'delivered').neq('status', 'cancelled'),
    fetchActiveProcessDetails(),
    supabase.from('team_members').select('production_hours_per_week').eq('active', true),
  ])

  const availableLaborHoursPerWeek = ((teamMembers ?? []) as Array<{ production_hours_per_week: number }>)
    .reduce((sum, m) => sum + Number(m.production_hours_per_week ?? 0), 0)

  // piezas por (producto, día)
  const piecesByDayProduct = new Map<number, Map<string, { name: string; qty: number }>>()
  function addPieces(dow: number, productId: string, name: string, qty: number) {
    if (!piecesByDayProduct.has(dow)) piecesByDayProduct.set(dow, new Map())
    const day = piecesByDayProduct.get(dow)!
    const prev = day.get(productId)
    day.set(productId, { name, qty: (prev?.qty ?? 0) + qty })
  }

  for (const item of (planItems ?? []) as unknown as Array<{ product_id: string; day_of_week: number; quantity_planned: number; products: { name: string } | null }>) {
    addPieces(item.day_of_week, item.product_id, item.products?.name ?? item.product_id, item.quantity_planned)
  }
  for (const order of (specialOrders ?? []) as Array<{ delivery_date: string; special_order_items: Array<{ product_id: string | null; product_name: string; quantity: number }> }>) {
    const dow = dayOfWeekISO(order.delivery_date)
    for (const soi of order.special_order_items ?? []) {
      if (!soi.product_id) continue
      addPieces(dow, soi.product_id, soi.product_name, soi.quantity)
    }
  }

  const processById = new Map(processes.map((p) => [p.id, p]))
  const days: DayCapacitySummary[] = []
  const productsWithoutTimeData = new Set<string>()

  for (const [dow, piecesByProduct] of piecesByDayProduct) {
    const { runsByProcess, productsWithoutProcess } = computeProcessRuns(piecesByProduct, processes)
    productsWithoutProcess.forEach((n) => productsWithoutTimeData.add(n))

    // piezas totales del día (todas las planeadas, tengan proceso o no)
    let totalPieces = 0
    for (const { qty } of piecesByProduct.values()) totalPieces += qty

    const day: DayCapacitySummary = {
      dow, total_pieces: totalPieces, batches: [],
      required_calendar_hours: 0, required_labor_hours: 0,
    }

    for (const [processId, runs] of runsByProcess) {
      if (runs <= 0) continue
      const proc = processById.get(processId)
      if (!proc) continue
      const cal = (proc.calendar_time_hours ?? 0) * runs
      const lab = (proc.labor_hours_per_batch ?? 0) * runs
      const hasTime = !!(proc.calendar_time_hours || proc.labor_hours_per_batch)
      if (!hasTime) productsWithoutTimeData.add(proc.name)

      // piezas producidas por este proceso este día (suma de sus outputs planeados)
      let procPieces = 0
      for (const o of proc.outputs) {
        const hit = piecesByProduct.get(o.product_id)
        if (hit) procPieces += hit.qty
      }

      day.required_calendar_hours += cal
      day.required_labor_hours += lab
      day.batches.push({
        product_id: proc.id, product_name: proc.name, pieces: procPieces,
        batches_required: runs,
        calendar_hours: Math.round(cal * 100) / 100,
        labor_hours: Math.round(lab * 100) / 100,
        has_time_data: hasTime,
      })
    }

    day.required_calendar_hours = Math.round(day.required_calendar_hours * 100) / 100
    day.required_labor_hours = Math.round(day.required_labor_hours * 100) / 100
    day.batches.sort((a, b) => b.pieces - a.pieces)
    days.push(day)
  }

  days.sort((a, b) => a.dow - b.dow)

  const totalCalendarHours = days.reduce((s, d) => s + d.required_calendar_hours, 0)
  const totalLaborHours = days.reduce((s, d) => s + d.required_labor_hours, 0)
  const totalPieces = days.reduce((s, d) => s + d.total_pieces, 0)

  return {
    days,
    total_pieces: totalPieces,
    total_calendar_hours: Math.round(totalCalendarHours * 100) / 100,
    total_labor_hours: Math.round(totalLaborHours * 100) / 100,
    available_labor_hours_per_week: availableLaborHoursPerWeek,
    utilization_percent: availableLaborHoursPerWeek > 0
      ? Math.round((totalLaborHours / availableLaborHoursPerWeek) * 100 * 10) / 10
      : null,
    products_without_time_data: [...productsWithoutTimeData],
  }
}
