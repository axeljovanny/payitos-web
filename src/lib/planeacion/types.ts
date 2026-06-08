export type PlanStatus = 'draft' | 'confirmed'

export interface WeeklyPlanRow {
  id: string
  week_start: string
  status: PlanStatus
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface WeeklyPlanItemRow {
  id: string
  plan_id: string
  product_id: string
  day_of_week: number // 1=Mon..7=Sun
  quantity_planned: number
  products?: { name: string; category: string } | null
}

export interface ProductForPlan {
  id: string
  name: string
  category: string
  has_recipe: boolean
  recipe_id: string | null
  batch_yield: number | null
  labor_hours_per_batch: number | null
  calendar_time_hours: number | null
}

export interface SpecialOrderLine {
  order_id: string
  customer_name: string
  delivery_date: string
  day_of_week: number
  product_id: string | null
  product_name: string
  quantity: number
}

export type SpecialOrdersByDay = Record<number, SpecialOrderLine[]>

export interface IngredientRequirement {
  ingredient_id: string
  ingredient_name: string
  unit: string
  required_quantity: number
  current_stock: number
  shortage: number
}

export interface WeeklyPlanIngredientResult {
  requirements: IngredientRequirement[]
  products_without_recipe: string[]
  products_without_ingredients: string[]
  shopping_list: IngredientRequirement[]
}

// ── Capacity types ─────────────────────────────────────────────────────────────

export interface DayCapacitySummary {
  dow: number              // 1=Lun … 7=Dom
  total_pieces: number     // piezas planeadas + pedidos especiales
  batches: Array<{
    product_id: string
    product_name: string
    pieces: number
    batches_required: number
    calendar_hours: number // batches × recipe.calendar_time_hours (null → 0)
    labor_hours: number    // batches × recipe.labor_hours_per_batch (null → 0)
    has_time_data: boolean // si la receta tiene pasos configurados
  }>
  required_calendar_hours: number
  required_labor_hours: number
}

export interface WeekCapacitySummary {
  days: DayCapacitySummary[]
  total_pieces: number
  total_calendar_hours: number
  total_labor_hours: number
  available_labor_hours_per_week: number // de team_members activos
  utilization_percent: number | null     // total_labor_hours / available × 100
  products_without_time_data: string[]   // recetas sin pasos de producción configurados
}
