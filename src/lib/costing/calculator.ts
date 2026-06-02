import type {
  ProductRow,
  RecipeRow,
  IngredientCostLine,
  CostBreakdown,
  CostStatus,
  LaborCostContext,
  OverheadCostContext,
} from './types'
import { convertUnit } from './units'

export function calculateCost(
  product: ProductRow,
  recipe: RecipeRow | null,
  latestPrices: Map<string, number>,
  laborCtx: LaborCostContext | null = null,
  overheadCtx: OverheadCostContext | null = null,
): CostBreakdown {
  if (!recipe || !recipe.recipe_ingredients?.length) {
    return {
      product,
      recipe,
      lines: [],
      batch_cost: null,
      cost_per_piece: null,
      labor_cost_per_piece: null,
      overhead_cost_per_piece: null,
      total_cost_per_piece: null,
      margin_percent: null,
      is_estimated: false,
      missing_prices: [],
      status: recipe ? 'incomplete_prices' : 'no_recipe',
    }
  }

  // ── Ingredient calculation ───────────────────────────────────────────────
  const lines: IngredientCostLine[] = []
  let batchCost = 0
  const missingPrices: string[] = []

  for (const ri of recipe.recipe_ingredients) {
    const ingredientName = ri.ingredients?.name ?? `id:${ri.ingredient_id}`
    const baseUnit = ri.ingredients?.base_unit ?? ri.unit
    const unitPrice = latestPrices.get(ri.ingredient_id) ?? null

    let lineCost: number | null = null
    let unitMismatch = false

    if (unitPrice != null) {
      const conv = convertUnit(ri.quantity, ri.unit, baseUnit)
      if (conv.ok) {
        const effectiveQty = conv.value * (1 + ri.waste_factor_percent / 100)
        lineCost = effectiveQty * unitPrice
        batchCost += lineCost
      } else {
        unitMismatch = true
        missingPrices.push(`${ingredientName} (unidad incompatible: ${ri.unit} → ${baseUnit})`)
      }
    } else {
      missingPrices.push(`${ingredientName} (sin precio registrado)`)
    }

    lines.push({
      ingredient_name: ingredientName,
      quantity: ri.quantity,
      unit: ri.unit,
      waste_factor_percent: ri.waste_factor_percent,
      unit_price: unitPrice,
      line_cost: lineCost,
      unit_mismatch: unitMismatch,
    })
  }

  const isEstimated = missingPrices.length > 0
  const ingredientCostPerPiece = recipe.batch_yield > 0 ? batchCost / recipe.batch_yield : null

  // ── Labor cost: (avg hourly rate × production hours) / batch yield ───────
  let laborCostPerPiece: number | null = null
  if (laborCtx && recipe.production_time_hours > 0 && recipe.batch_yield > 0) {
    laborCostPerPiece =
      (laborCtx.average_hourly_rate * recipe.production_time_hours) / recipe.batch_yield
  }

  // ── Overhead cost: (fixed + energy per hour × production hours) / yield ──
  let overheadCostPerPiece: number | null = null
  if (overheadCtx && recipe.production_time_hours > 0 && recipe.batch_yield > 0) {
    const overheadPerBatch =
      (overheadCtx.fixed_cost_per_hour + overheadCtx.energy_cost_per_hour) *
      recipe.production_time_hours
    overheadCostPerPiece = overheadPerBatch / recipe.batch_yield
  }

  // ── Total: ingredient + labor + overhead (unknown components treated as 0) ─
  const totalCostPerPiece =
    ingredientCostPerPiece != null
      ? ingredientCostPerPiece + (laborCostPerPiece ?? 0) + (overheadCostPerPiece ?? 0)
      : null

  const effectiveCost = totalCostPerPiece ?? ingredientCostPerPiece
  const marginPercent =
    effectiveCost != null && product.sale_price > 0
      ? ((product.sale_price - effectiveCost) / product.sale_price) * 100
      : null

  let status: CostStatus = 'ok'
  if (isEstimated) {
    status = 'incomplete_prices'
  } else if (
    effectiveCost != null &&
    product.sale_price > 0 &&
    effectiveCost > product.sale_price
  ) {
    status = 'price_insufficient'
  } else if (marginPercent != null && marginPercent < product.target_margin_percent) {
    status = 'margin_low'
  }

  return {
    product,
    recipe,
    lines,
    batch_cost: batchCost,
    cost_per_piece: ingredientCostPerPiece,
    labor_cost_per_piece: laborCostPerPiece,
    overhead_cost_per_piece: overheadCostPerPiece,
    total_cost_per_piece: totalCostPerPiece,
    margin_percent: marginPercent,
    is_estimated: isEstimated,
    missing_prices: missingPrices,
    status,
  }
}
