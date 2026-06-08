// Motor de costeo de una corrida/proceso — función pura, sin DB.
// Reparte costos compartidos entre las variantes que realmente los consumen.

import { calcLineCost, convertUnit } from '@/lib/costing/units'
import type { UnitPrice, PrepCost } from '@/lib/preparaciones/costing'

export interface CostingOutput {
  product_id: string
  pieces: number
}

export interface CostingComponent {
  label?: string | null
  source_type: 'ingredient' | 'preparation'
  ingredient_id: string | null
  preparation_id: string | null
  quantity: number
  unit: string
  waste_factor_percent: number
  allocation_mode: 'all' | 'subset'
  consumers: Array<{ product_id: string; weight: number }>
}

export interface OutputCost {
  product_id: string
  pieces: number
  material_cost: number
  labor_cost: number | null
  overhead_cost: number | null
  total_cost: number | null
  cost_per_piece: number | null
}

export interface ProcessCost {
  total_pieces: number
  labor_hours: number
  calendar_hours: number
  batch_material_cost: number
  batch_labor_cost: number | null
  batch_overhead_cost: number | null
  batch_total_cost: number | null
  per_output: OutputCost[]
  missing: string[]            // labels/insumos sin precio
}

interface Params {
  outputs: CostingOutput[]
  components: CostingComponent[]
  laborHours: number
  calendarHours: number
  prices: Record<string, UnitPrice>
  prepCosts: Map<string, PrepCost>
  hourlyLaborRate?: number | null
  overheadPerHour?: number | null
}

export function componentCost(
  c: CostingComponent,
  prices: Record<string, UnitPrice>,
  prepCosts: Map<string, PrepCost>,
): { cost: number; ok: boolean } {
  if (c.source_type === 'ingredient') {
    const price = c.ingredient_id ? prices[c.ingredient_id] : undefined
    if (!price) return { cost: 0, ok: false }
    const line = calcLineCost(c.quantity, c.unit, c.waste_factor_percent, price.unitPrice, price.baseUnit)
    return line.ok ? { cost: line.value, ok: true } : { cost: 0, ok: false }
  }
  const prep = c.preparation_id ? prepCosts.get(c.preparation_id) : undefined
  if (!prep || !prep.ok) return { cost: 0, ok: false }
  const conv = convertUnit(c.quantity, c.unit, prep.yieldUnit)
  if (!conv.ok) return { cost: 0, ok: false }
  const effective = conv.value * (1 + c.waste_factor_percent / 100)
  return { cost: effective * prep.unitCost, ok: true }
}

export function computeProcessCost(p: Params): ProcessCost {
  const totalPieces = p.outputs.reduce((s, o) => s + o.pieces, 0)

  // Acumuladores de material por producto
  const material = new Map<string, number>()
  p.outputs.forEach((o) => material.set(o.product_id, 0))

  let batchMaterial = 0
  const missing: string[] = []

  for (const c of p.components) {
    const { cost, ok } = componentCost(c, p.prices, p.prepCosts)
    if (!ok) {
      missing.push(c.label || c.ingredient_id || c.preparation_id || 'componente')
      continue
    }
    batchMaterial += cost

    // Porción por variante: 'all' → todas con porción 1; 'subset' → lista con su peso
    const weightByProduct = new Map<string, number>()
    if (c.allocation_mode === 'all') {
      for (const o of p.outputs) weightByProduct.set(o.product_id, 1)
    } else {
      for (const cc of c.consumers) weightByProduct.set(cc.product_id, cc.weight > 0 ? cc.weight : 1)
    }

    // Reparto ponderado: costo × (piezas × porción) / Σ(piezas × porción)
    const participating = p.outputs.reduce(
      (s, o) => s + (weightByProduct.has(o.product_id) ? o.pieces * weightByProduct.get(o.product_id)! : 0),
      0,
    )
    if (participating <= 0) continue

    for (const o of p.outputs) {
      const w = weightByProduct.get(o.product_id)
      if (!w) continue
      const share = cost * ((o.pieces * w) / participating)
      material.set(o.product_id, (material.get(o.product_id) ?? 0) + share)
    }
  }

  const hasLabor = p.hourlyLaborRate != null && p.hourlyLaborRate > 0
  const hasOverhead = p.overheadPerHour != null && p.overheadPerHour > 0

  const batchLabor = hasLabor ? p.laborHours * (p.hourlyLaborRate as number) : null
  const batchOverhead = hasOverhead ? p.calendarHours * (p.overheadPerHour as number) : null

  const perOutput: OutputCost[] = p.outputs.map((o) => {
    const mat = material.get(o.product_id) ?? 0
    const pieceShare = totalPieces > 0 ? o.pieces / totalPieces : 0
    const labor = batchLabor != null ? batchLabor * pieceShare : null
    const overhead = batchOverhead != null ? batchOverhead * pieceShare : null
    const total = mat + (labor ?? 0) + (overhead ?? 0)
    return {
      product_id: o.product_id,
      pieces: o.pieces,
      material_cost: mat,
      labor_cost: labor,
      overhead_cost: overhead,
      total_cost: total,
      cost_per_piece: o.pieces > 0 ? total / o.pieces : null,
    }
  })

  const batchTotal = batchMaterial + (batchLabor ?? 0) + (batchOverhead ?? 0)

  return {
    total_pieces: totalPieces,
    labor_hours: p.laborHours,
    calendar_hours: p.calendarHours,
    batch_material_cost: batchMaterial,
    batch_labor_cost: batchLabor,
    batch_overhead_cost: batchOverhead,
    batch_total_cost: batchTotal,
    per_output: perOutput,
    missing,
  }
}
