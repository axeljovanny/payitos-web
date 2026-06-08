// Costeo de preparaciones (subrecetas) — función pura, sin DB.
// Resuelve costo unitario por preparación, soportando anidamiento (una preparación
// que usa otra) con memoización y guardia anti-ciclos.

import { calcLineCost, convertUnit } from '@/lib/costing/units'

export interface UnitPrice {
  unitPrice: number
  baseUnit: string
}

export interface PrepForCosting {
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

export interface PrepCost {
  ok: boolean              // false si falta algún precio o conversión
  batchCost: number        // costo de un lote (yield_quantity)
  unitCost: number         // costo por yield_unit
  yieldUnit: string
  missing: string[]        // ingredient_ids o prep_ids sin resolver
}

/**
 * Devuelve un Map<preparationId, PrepCost> con el costo de cada preparación.
 */
export function computePrepCosts(
  preps: PrepForCosting[],
  prices: Record<string, UnitPrice>,
): Map<string, PrepCost> {
  const byId = new Map(preps.map((p) => [p.id, p]))
  const memo = new Map<string, PrepCost>()
  const visiting = new Set<string>()

  function resolve(id: string): PrepCost {
    const cached = memo.get(id)
    if (cached) return cached

    const prep = byId.get(id)
    if (!prep) {
      return { ok: false, batchCost: 0, unitCost: 0, yieldUnit: 'pza', missing: [id] }
    }
    if (visiting.has(id)) {
      // ciclo detectado — corta sin sumar
      return { ok: false, batchCost: 0, unitCost: 0, yieldUnit: prep.yield_unit, missing: [id] }
    }
    visiting.add(id)

    let batchCost = 0
    let ok = true
    const missing: string[] = []

    for (const item of prep.items) {
      if (item.source_type === 'ingredient') {
        const price = item.ingredient_id ? prices[item.ingredient_id] : undefined
        if (!price) { ok = false; if (item.ingredient_id) missing.push(item.ingredient_id); continue }
        const line = calcLineCost(item.quantity, item.unit, item.waste_factor_percent, price.unitPrice, price.baseUnit)
        if (!line.ok) { ok = false; continue }
        batchCost += line.value
      } else {
        const childId = item.child_preparation_id
        if (!childId) { ok = false; continue }
        const child = resolve(childId)
        if (!child.ok) { ok = false; missing.push(...child.missing); continue }
        const conv = convertUnit(item.quantity, item.unit, child.yieldUnit)
        if (!conv.ok) { ok = false; continue }
        const effective = conv.value * (1 + item.waste_factor_percent / 100)
        batchCost += effective * child.unitCost
      }
    }

    visiting.delete(id)
    const unitCost = prep.yield_quantity > 0 ? batchCost / prep.yield_quantity : 0
    const result: PrepCost = { ok, batchCost, unitCost, yieldUnit: prep.yield_unit, missing }
    memo.set(id, result)
    return result
  }

  for (const p of preps) resolve(p.id)
  return memo
}
