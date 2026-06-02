// ── Ingredient inventory ────────────────────────────────────────────────────

export interface IngredientStockRow {
  id: string
  ingredient_id: string
  quantity: number
  unit: string
  last_updated: string
  ingredients?: { name: string; base_unit: string }
}

export type IngredientMovementType = 'purchase' | 'consumption' | 'waste' | 'adjustment'

export interface IngredientMovementRow {
  id: string
  ingredient_id: string
  movement_type: IngredientMovementType
  quantity: number
  unit: string
  notes: string | null
  reference_id: string | null
  created_by: string | null
  created_at: string
  ingredients?: { name: string }
}

// ── Finished goods inventory ─────────────────────────────────────────────────

export interface ProductStockRow {
  id: string
  product_id: string
  quantity: number
  last_updated: string
  products?: { name: string; category: string }
}

export type ProductMovementType =
  | 'production'
  | 'sale'
  | 'waste'
  | 'adjustment'
  | 'special_order'

export interface ProductMovementRow {
  id: string
  product_id: string
  movement_type: ProductMovementType
  quantity: number
  notes: string | null
  reference_id: string | null
  created_by: string | null
  created_at: string
  products?: { name: string }
}

// ── Weekly planning ──────────────────────────────────────────────────────────

export type WeeklyPlanStatus = 'draft' | 'confirmed'

export interface WeeklyPlanRow {
  id: string
  week_start: string
  status: WeeklyPlanStatus
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface WeeklyPlanItemRow {
  id: string
  plan_id: string
  product_id: string
  day_of_week: number // 1=Mon … 7=Sun
  quantity_planned: number
  products?: { name: string; category: string; cooking_type: string }
}

// ── Daily production sheet ───────────────────────────────────────────────────

export type DailySheetStatus = 'pending' | 'in_progress' | 'completed'

export interface DailySheetRow {
  id: string
  sheet_date: string
  status: DailySheetStatus
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface DailySheetItemRow {
  id: string
  sheet_id: string
  product_id: string
  quantity_planned: number
  quantity_produced: number
  notes: string | null
  products?: { name: string; category: string; cooking_type: string }
}

// Unified production item — source is either an explicit daily sheet or
// the weekly plan used as fallback when no sheet exists yet.
export interface DailyProductionItem {
  product_id: string
  product_name: string
  product_category: string
  cooking_type: string
  quantity_planned: number
  quantity_produced: number
  source: 'sheet' | 'weekly_plan'
}

// ── Special orders ────────────────────────────────────────────────────────────

export type SpecialOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_production'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export interface SpecialOrderRow {
  id: string
  customer_name: string
  order_date: string
  delivery_date: string
  status: SpecialOrderStatus
  notes: string | null
  total_amount: number | null
  created_by: string | null
  created_at: string
}

export interface SpecialOrderItemRow {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number | null
  notes: string | null
}

export interface SpecialOrderWithItems extends SpecialOrderRow {
  special_order_items: SpecialOrderItemRow[]
}

// ── Daily view aggregate ──────────────────────────────────────────────────────

export interface DailyView {
  date: string
  sheet: DailySheetRow | null
  items: DailyProductionItem[]
  special_orders: SpecialOrderWithItems[]
}
