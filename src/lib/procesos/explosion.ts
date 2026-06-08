// Explosión de un proceso a insumos crudos — función pura, sin DB.
// Resuelve componentes (insumo directo o preparación) hasta ingredientes,
// expandiendo preparaciones anidadas. Devuelve cantidades por una corrida.

import { convertUnit } from '@/lib/costing/units'

export interface PrepDef {
  id: string
  yield_quantity: number
  yield_unit: string
  items: Array<{
    source_type: 'ingredient' | 'preparation'
    ingredient_id: string | null
    child_preparation_id: string | null
    quantity: number
    unit: string
    waste_factor_percent: number
  }>
}

export interface ProcessComponentForExplosion {
  source_type: 'ingredient' | 'preparation'
  ingredient_id: string | null
  preparation_id: string | null
  quantity: number
  unit: string
  waste_factor_percent: number
}

export interface ExplodedIngredient {
  ingredient_id: string
  name: string
  unit: string
  quantity: number
}

interface Maps {
  prepsById: Map<string, PrepDef>
  ingredientBaseUnit: Map<string, string>
  ingredientName: Map<string, string>
}

function addIngredient(
  acc: Map<string, ExplodedIngredient>,
  maps: Maps,
  ingredientId: string,
  qty: number,
  fromUnit: string,
) {
  const baseUnit = maps.ingredientBaseUnit.get(ingredientId) ?? fromUnit
  const conv = convertUnit(qty, fromUnit, baseUnit)
  const finalQty = conv.ok ? conv.value : qty
  const finalUnit = conv.ok ? baseUnit : fromUnit
  const prev = acc.get(ingredientId)
  if (prev) {
    prev.quantity += finalQty
  } else {
    acc.set(ingredientId, {
      ingredient_id: ingredientId,
      name: maps.ingredientName.get(ingredientId) ?? ingredientId,
      unit: finalUnit,
      quantity: finalQty,
    })
  }
}

// Expande una preparación en sus insumos crudos. `batches` = nº de lotes de la prep.
function explodePrep(
  acc: Map<string, ExplodedIngredient>,
  maps: Maps,
  prepId: string,
  batches: number,
  guard: Set<string>,
) {
  if (guard.has(prepId)) return // ciclo
  const prep = maps.prepsById.get(prepId)
  if (!prep) return
  guard.add(prepId)

  for (const item of prep.items) {
    const eff = item.quantity * batches * (1 + item.waste_factor_percent / 100)
    if (item.source_type === 'ingredient' && item.ingredient_id) {
      addIngredient(acc, maps, item.ingredient_id, eff, item.unit)
    } else if (item.source_type === 'preparation' && item.child_preparation_id) {
      const child = maps.prepsById.get(item.child_preparation_id)
      if (!child) continue
      const conv = convertUnit(eff, item.unit, child.yield_unit)
      const amountInYield = conv.ok ? conv.value : eff
      const childBatches = child.yield_quantity > 0 ? amountInYield / child.yield_quantity : 0
      explodePrep(acc, maps, item.child_preparation_id, childBatches, guard)
    }
  }

  guard.delete(prepId)
}

// Insumos crudos para UNA corrida del proceso.
export function explodeProcessPerRun(
  components: ProcessComponentForExplosion[],
  maps: Maps,
): ExplodedIngredient[] {
  const acc = new Map<string, ExplodedIngredient>()

  for (const c of components) {
    if (c.source_type === 'ingredient' && c.ingredient_id) {
      const eff = c.quantity * (1 + c.waste_factor_percent / 100)
      addIngredient(acc, maps, c.ingredient_id, eff, c.unit)
    } else if (c.source_type === 'preparation' && c.preparation_id) {
      const prep = maps.prepsById.get(c.preparation_id)
      if (!prep) continue
      const conv = convertUnit(c.quantity, c.unit, prep.yield_unit)
      const amountInYield = conv.ok ? conv.value : c.quantity
      const batches = prep.yield_quantity > 0 ? amountInYield / prep.yield_quantity : 0
      explodePrep(acc, maps, c.preparation_id, batches * (1 + c.waste_factor_percent / 100), new Set())
    }
  }

  return [...acc.values()]
}
