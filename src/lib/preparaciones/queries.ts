import { createClient } from '@/lib/supabase/server'
import { fetchLatestIngredientPrices } from '@/lib/ingredientes/queries'
import { computePrepCosts } from './costing'
import type { Preparation, PreparationListItem, PreparationOption } from './types'
import type { PrepForCosting } from './costing'

export async function fetchPreparations(): Promise<PreparationListItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('preparations')
    .select('id, name, yield_quantity, yield_unit, active, preparation_items!preparation_id(id)')
    .order('active', { ascending: false })
    .order('name')

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    yield_quantity: Number(p.yield_quantity),
    yield_unit: p.yield_unit as string,
    active: p.active as boolean,
    item_count: Array.isArray(p.preparation_items) ? p.preparation_items.length : 0,
  }))
}

export async function fetchPreparationById(id: string): Promise<Preparation | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('preparations')
    .select(`
      id, name, yield_quantity, yield_unit, active, notes,
      preparation_items!preparation_id (
        id, preparation_id, source_type, ingredient_id, child_preparation_id,
        quantity, unit, waste_factor_percent
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (!data) return null
  const raw = data as unknown as Record<string, unknown>
  return {
    id: raw.id as string,
    name: raw.name as string,
    yield_quantity: Number(raw.yield_quantity),
    yield_unit: raw.yield_unit as string,
    active: raw.active as boolean,
    notes: (raw.notes as string | null) ?? null,
    items: ((raw.preparation_items as unknown[]) ?? []) as Preparation['items'],
  }
}

// Opciones para selectores (componentes de proceso / anidamiento)
export async function fetchPreparationOptions(): Promise<PreparationOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('preparations')
    .select('id, name, yield_unit')
    .eq('active', true)
    .order('name')
  return (data ?? []) as PreparationOption[]
}

// Todas las preparaciones con sus items, para construir el grafo de costos.
export async function fetchPrepsForCosting(): Promise<PrepForCosting[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('preparations')
    .select(`
      id, yield_quantity, yield_unit,
      preparation_items!preparation_id (
        source_type, ingredient_id, child_preparation_id, quantity, unit, waste_factor_percent
      )
    `)

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((p) => ({
    id: p.id as string,
    yield_quantity: Number(p.yield_quantity),
    yield_unit: p.yield_unit as string,
    items: ((p.preparation_items as PrepForCosting['items']) ?? []),
  }))
}

// Mapa de costo por preparación para previews/selectores.
export async function fetchPrepCostMap(): Promise<Record<string, { unitCost: number; yieldUnit: string }>> {
  const [preps, prices] = await Promise.all([fetchPrepsForCosting(), fetchLatestIngredientPrices()])
  const costs = computePrepCosts(preps, prices)
  const out: Record<string, { unitCost: number; yieldUnit: string }> = {}
  for (const [id, c] of costs) out[id] = { unitCost: c.unitCost, yieldUnit: c.yieldUnit }
  return out
}
