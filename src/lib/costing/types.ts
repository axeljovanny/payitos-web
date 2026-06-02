export interface ProductRow {
  id: string
  name: string
  category: string
  active: boolean
  sale_price: number
  target_margin_percent: number
  default_batch_yield: number
  production_time_hours: number
  cooking_type: string
}

export interface IngredientRow {
  id: string
  name: string
  base_unit: string
  prep_recipe_id?: string | null
}

export interface IngredientCategoryRow {
  id: string
  name: string
  description: string | null
}

export interface RecipeIngredientRow {
  id: string
  ingredient_id: string
  quantity: number
  unit: string
  waste_factor_percent: number
  ingredients: IngredientRow | null
}

export interface RecipeRow {
  id: string
  product_id: string
  batch_yield: number
  yield_unit: string
  production_time_hours: number
  cooking_type: string
  active: boolean
  recipe_ingredients: RecipeIngredientRow[]
}

export interface TeamMemberRow {
  id: string
  name: string
  role_type: string
  active: boolean
}

export interface WageRow {
  id: string
  team_member_id: string
  hourly_rate: number
  effective_from: string
}

export interface FixedCostRow {
  id: string
  name: string
  category: string
  amount_monthly: number
  active: boolean
}

export interface VariableExpenseRow {
  id: string
  name: string
  category: string
  amount_per_hour: number | null
  amount_fixed: number | null
  active: boolean
}

// Inputs to the cost engine beyond ingredient costs
export interface LaborCostContext {
  average_hourly_rate: number
}

export interface OverheadCostContext {
  fixed_cost_per_hour: number
  energy_cost_per_hour: number
}

export type CostStatus =
  | 'ok'
  | 'margin_low'
  | 'price_insufficient'
  | 'incomplete_prices'
  | 'no_recipe'

export interface IngredientCostLine {
  ingredient_name: string
  quantity: number
  unit: string
  waste_factor_percent: number
  unit_price: number | null
  line_cost: number | null
  unit_mismatch: boolean
}

export interface CostBreakdown {
  product: ProductRow
  recipe: RecipeRow | null
  lines: IngredientCostLine[]
  batch_cost: number | null
  cost_per_piece: number | null          // ingredient cost only
  labor_cost_per_piece: number | null
  overhead_cost_per_piece: number | null
  total_cost_per_piece: number | null    // ingredient + labor + overhead
  margin_percent: number | null          // uses total when available, else ingredient
  is_estimated: boolean
  missing_prices: string[]
  status: CostStatus
}
