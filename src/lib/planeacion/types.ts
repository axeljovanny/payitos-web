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
