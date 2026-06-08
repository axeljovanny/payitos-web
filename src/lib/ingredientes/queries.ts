import { createClient } from '@/lib/supabase/server'

export interface IngredienteListItem {
  id: string
  name: string
  base_unit: string
  active: boolean
  category_id: string | null
  supplier_name: string | null
  ingredient_categories: { name: string } | null
  unit_price: number | null
  presentation_name: string | null
  presentation_quantity: number | null
  presentation_unit: string | null
  purchase_price: number | null
  effective_from: string | null
}

export interface IngredienteDetail {
  id: string
  name: string
  base_unit: string
  active: boolean
  category_id: string | null
  supplier_name: string | null
  supplier_notes: string | null
  min_stock_target: number
  ingredient_categories: { name: string } | null
}

export interface PriceHistoryEntry {
  id: string
  ingredient_id: string
  presentation_name: string
  presentation_quantity: number
  presentation_unit: string
  purchase_price: number
  unit_price: number
  effective_from: string
}

export interface CategoryOption {
  id: string
  name: string
}

export interface IngredientPrice {
  unitPrice: number
  baseUnit: string
}

export async function fetchIngredientes(): Promise<IngredienteListItem[]> {
  const supabase = await createClient()

  const [{ data: priceHistory }, { data: ingredients }] = await Promise.all([
    supabase
      .from('ingredient_price_history')
      .select('ingredient_id, unit_price, presentation_name, presentation_quantity, presentation_unit, purchase_price, effective_from')
      .order('effective_from', { ascending: false }),
    supabase
      .from('ingredients')
      .select('id, name, base_unit, active, category_id, supplier_name, ingredient_categories(name)')
      .order('active', { ascending: false })
      .order('name'),
  ])

  const priceMap = new Map<string, {
    unit_price: number
    presentation_name: string
    presentation_quantity: number
    presentation_unit: string
    purchase_price: number
    effective_from: string
  }>()

  priceHistory?.forEach((ph) => {
    if (!priceMap.has(ph.ingredient_id)) {
      priceMap.set(ph.ingredient_id, {
        unit_price: Number(ph.unit_price),
        presentation_name: ph.presentation_name,
        presentation_quantity: Number(ph.presentation_quantity),
        presentation_unit: ph.presentation_unit,
        purchase_price: Number(ph.purchase_price),
        effective_from: ph.effective_from,
      })
    }
  })

  return (ingredients ?? []).map((ing) => {
    const raw = ing as Record<string, unknown>
    const price = priceMap.get(raw.id as string)
    return {
      id: raw.id as string,
      name: raw.name as string,
      base_unit: raw.base_unit as string,
      active: raw.active as boolean,
      category_id: (raw.category_id as string | null) ?? null,
      supplier_name: (raw.supplier_name as string | null) ?? null,
      ingredient_categories: raw.ingredient_categories as { name: string } | null,
      unit_price: price?.unit_price ?? null,
      presentation_name: price?.presentation_name ?? null,
      presentation_quantity: price?.presentation_quantity ?? null,
      presentation_unit: price?.presentation_unit ?? null,
      purchase_price: price?.purchase_price ?? null,
      effective_from: price?.effective_from ?? null,
    }
  })
}

export async function fetchIngredienteById(id: string): Promise<IngredienteDetail | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ingredients')
    .select('id, name, base_unit, active, category_id, supplier_name, supplier_notes, min_stock_target, ingredient_categories(name)')
    .eq('id', id)
    .maybeSingle()

  return data as unknown as IngredienteDetail | null
}

export async function fetchPriceHistory(ingredientId: string): Promise<PriceHistoryEntry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ingredient_price_history')
    .select('id, ingredient_id, presentation_name, presentation_quantity, presentation_unit, purchase_price, unit_price, effective_from')
    .eq('ingredient_id', ingredientId)
    .order('effective_from', { ascending: false })
  return (data ?? []) as PriceHistoryEntry[]
}

// Opciones de insumos para selectores (preparaciones, procesos).
export async function fetchIngredientOptions(): Promise<{ id: string; name: string; base_unit: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ingredients')
    .select('id, name, base_unit')
    .eq('active', true)
    .order('name')
  return (data ?? []) as Array<{ id: string; name: string; base_unit: string }>
}

export async function fetchCategoryOptions(): Promise<CategoryOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ingredient_categories')
    .select('id, name')
    .order('name')
  return (data ?? []) as CategoryOption[]
}

// Mapa de precio unitario por insumo (desde el historial de precios).
// Las preparaciones ya NO son insumos — se costean aparte vía lib/preparaciones.
export async function fetchLatestIngredientPrices(): Promise<Record<string, IngredientPrice>> {
  const supabase = await createClient()

  const [{ data: ingredientsData }, { data: priceHistory }] = await Promise.all([
    supabase.from('ingredients').select('id, base_unit').eq('active', true),
    supabase
      .from('ingredient_price_history')
      .select('ingredient_id, unit_price, effective_from')
      .order('effective_from', { ascending: false }),
  ])

  const baseUnitMap = new Map<string, string>()
  ingredientsData?.forEach((i) => baseUnitMap.set(i.id as string, i.base_unit as string))

  const result: Record<string, IngredientPrice> = {}
  priceHistory?.forEach((ph) => {
    if (!result[ph.ingredient_id]) {
      result[ph.ingredient_id] = {
        unitPrice: Number(ph.unit_price),
        baseUnit: baseUnitMap.get(ph.ingredient_id) ?? 'g',
      }
    }
  })

  return result
}
