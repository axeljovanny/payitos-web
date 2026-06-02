import { createClient } from '@/lib/supabase/server'
import type {
  IngredientStockRow,
  ProductStockRow,
  WeeklyPlanRow,
  WeeklyPlanItemRow,
  DailySheetRow,
  DailySheetItemRow,
  DailyProductionItem,
  DailyView,
  SpecialOrderWithItems,
} from './types'

// ── Date helpers ─────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ISO date of the Monday of the week containing the given date
function weekStartISO(dateISO: string): string {
  const d = new Date(dateISO + 'T12:00:00Z')
  const jsDay = d.getUTCDay() // 0=Sun
  const offset = jsDay === 0 ? -6 : 1 - jsDay
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().split('T')[0]
}

// day_of_week as 1=Mon … 7=Sun for a given ISO date
function dayOfWeek(dateISO: string): number {
  const jsDay = new Date(dateISO + 'T12:00:00Z').getUTCDay()
  return jsDay === 0 ? 7 : jsDay
}

// ── Inventory snapshots ───────────────────────────────────────────────────────

export async function fetchIngredientStock(): Promise<IngredientStockRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ingredient_stock')
    .select('id, ingredient_id, quantity, unit, last_updated, ingredients(name, base_unit)')
  return (data ?? []) as unknown as IngredientStockRow[]
}

export async function fetchProductStock(): Promise<ProductStockRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('product_stock')
    .select('id, product_id, quantity, last_updated, products(name, category)')
    .gt('quantity', 0)
  return (data ?? []) as unknown as ProductStockRow[]
}

// ── Weekly plan ───────────────────────────────────────────────────────────────

export async function fetchWeeklyPlan(weekStart: string): Promise<{
  plan: WeeklyPlanRow | null
  items: WeeklyPlanItemRow[]
}> {
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('weekly_plans')
    .select('id, week_start, status, notes, created_by, created_at')
    .eq('week_start', weekStart)
    .maybeSingle()

  if (!plan) return { plan: null, items: [] }

  const { data: items } = await supabase
    .from('weekly_plan_items')
    .select(
      'id, plan_id, product_id, day_of_week, quantity_planned, products(name, category, cooking_type)'
    )
    .eq('plan_id', plan.id)

  return {
    plan: plan as WeeklyPlanRow,
    items: (items ?? []) as unknown as WeeklyPlanItemRow[],
  }
}

// ── Daily sheet ───────────────────────────────────────────────────────────────

export async function fetchDailySheet(date: string): Promise<{
  sheet: DailySheetRow | null
  items: DailySheetItemRow[]
}> {
  const supabase = await createClient()

  const { data: sheet } = await supabase
    .from('daily_production_sheets')
    .select('id, sheet_date, status, notes, created_by, created_at')
    .eq('sheet_date', date)
    .maybeSingle()

  if (!sheet) return { sheet: null, items: [] }

  const { data: items } = await supabase
    .from('daily_production_items')
    .select(
      'id, sheet_id, product_id, quantity_planned, quantity_produced, notes, products(name, category, cooking_type)'
    )
    .eq('sheet_id', sheet.id)

  return {
    sheet: sheet as DailySheetRow,
    items: (items ?? []) as unknown as DailySheetItemRow[],
  }
}

// ── Special orders ────────────────────────────────────────────────────────────

export async function fetchSpecialOrdersForRange(
  fromDate: string,
  toDate: string
): Promise<SpecialOrderWithItems[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('special_orders')
    .select(
      `id, customer_name, order_date, delivery_date, status, notes, total_amount, created_by, created_at,
       special_order_items ( id, order_id, product_id, product_name, quantity, unit_price, notes )`
    )
    .gte('delivery_date', fromDate)
    .lte('delivery_date', toDate)
    .neq('status', 'delivered')
    .neq('status', 'cancelled')
    .order('delivery_date')

  return (data ?? []) as unknown as SpecialOrderWithItems[]
}

// ── Aggregated daily view ─────────────────────────────────────────────────────

export async function fetchDailyView(date?: string): Promise<DailyView> {
  const targetDate = date ?? todayISO()
  const wStart = weekStartISO(targetDate)
  const dow = dayOfWeek(targetDate)

  const [{ sheet, items: sheetItems }, { items: planItems }, specialOrders] = await Promise.all([
    fetchDailySheet(targetDate),
    fetchWeeklyPlan(wStart),
    fetchSpecialOrdersForRange(targetDate, targetDate),
  ])

  let productionItems: DailyProductionItem[]

  if (sheet && sheetItems.length > 0) {
    productionItems = sheetItems
      .filter((item) => item.quantity_planned > 0 || item.quantity_produced > 0)
      .map((item) => ({
        product_id: item.product_id,
        product_name: item.products?.name ?? item.product_id,
        product_category: item.products?.category ?? '',
        cooking_type: item.products?.cooking_type ?? '',
        quantity_planned: item.quantity_planned,
        quantity_produced: item.quantity_produced,
        source: 'sheet' as const,
      }))
  } else {
    productionItems = planItems
      .filter((item) => item.day_of_week === dow && item.quantity_planned > 0)
      .map((item) => ({
        product_id: item.product_id,
        product_name: item.products?.name ?? item.product_id,
        product_category: item.products?.category ?? '',
        cooking_type: item.products?.cooking_type ?? '',
        quantity_planned: item.quantity_planned,
        quantity_produced: 0,
        source: 'weekly_plan' as const,
      }))
  }

  return {
    date: targetDate,
    sheet,
    items: productionItems,
    special_orders: specialOrders,
  }
}
