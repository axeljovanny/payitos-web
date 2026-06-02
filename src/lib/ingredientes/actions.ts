'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calcUnitPriceFromPresentation } from '@/lib/costing/units'

export type ActionState = { error: string | null }

export type InlineIngredienteResult = {
  error: string | null
  ingredient?: { id: string; name: string; base_unit: string }
  unit_price?: number
}

// ── Shared validation helpers ────────────────────────────────────────────────

function parsePriceFields(formData: FormData): {
  presentation_name: string
  presentation_quantity: number
  presentation_unit: string
  purchase_price: number
} | null {
  return {
    presentation_name: (formData.get('presentation_name') as string)?.trim() ?? '',
    presentation_quantity: Number(formData.get('presentation_quantity')),
    presentation_unit: (formData.get('presentation_unit') as string)?.trim() ?? '',
    purchase_price: Number(formData.get('purchase_price')),
  }
}

// ── Create ingredient + first price history atomically ────────────────────────

export async function createIngrediente(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = (formData.get('name') as string)?.trim()
  const base_unit = (formData.get('base_unit') as string)?.trim()
  const category_id = (formData.get('category_id') as string) || null
  const supplier_name = (formData.get('supplier_name') as string)?.trim() || null
  const min_stock_target = Math.max(0, Number(formData.get('min_stock_target') ?? 0))
  const prep_recipe_id = (formData.get('prep_recipe_id') as string) || null
  const context_path = (formData.get('context_path') as string) || '/panadero/ingredientes'

  if (!name || !base_unit) return { error: 'Nombre y unidad base son requeridos.' }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('ingredients')
    .select('id')
    .ilike('name', name)
    .maybeSingle()

  if (existing) return { error: `Ya existe un ingrediente con el nombre "${name}".` }

  const { data: ingredient, error: ingError } = await supabase
    .from('ingredients')
    .insert({ name, base_unit, category_id, supplier_name, min_stock_target, prep_recipe_id, active: true })
    .select('id')
    .single()

  if (ingError || !ingredient) return { error: ingError?.message ?? 'Error al crear ingrediente.' }

  // Preparaciones (prep_recipe_id) no requieren precio inicial — el costo se computa desde la receta.
  if (!prep_recipe_id) {
    const priceFields = parsePriceFields(formData)
    if (!priceFields) {
      await supabase.from('ingredients').delete().eq('id', ingredient.id)
      return { error: 'Datos de precio inválidos.' }
    }
    const { presentation_name, presentation_quantity, presentation_unit, purchase_price } = priceFields

    if (!presentation_name || !presentation_unit || presentation_quantity <= 0) {
      await supabase.from('ingredients').delete().eq('id', ingredient.id)
      return { error: 'Presentación, cantidad y unidad de precio son requeridas.' }
    }

    const unitPriceResult = calcUnitPriceFromPresentation(
      purchase_price, presentation_quantity, presentation_unit, base_unit
    )
    if (!unitPriceResult.ok) {
      await supabase.from('ingredients').delete().eq('id', ingredient.id)
      return { error: `Error de conversión: ${unitPriceResult.error}.` }
    }

    const { error: priceError } = await supabase.from('ingredient_price_history').insert({
      ingredient_id: ingredient.id,
      presentation_name,
      presentation_quantity,
      presentation_unit,
      purchase_price,
      unit_price: unitPriceResult.value,
    })

    if (priceError) {
      await supabase.from('ingredients').delete().eq('id', ingredient.id)
      return { error: `Ingrediente creado pero falló el precio: ${priceError.message}` }
    }
  }

  revalidatePath(context_path)
  redirect(context_path)
}

// ── Update ingredient metadata (not price) ───────────────────────────────────

export async function updateIngrediente(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const base_unit = (formData.get('base_unit') as string)?.trim()
  const category_id = (formData.get('category_id') as string) || null
  const supplier_name = (formData.get('supplier_name') as string)?.trim() || null
  const min_stock_target = Math.max(0, Number(formData.get('min_stock_target') ?? 0))
  const prep_recipe_id = (formData.get('prep_recipe_id') as string) || null
  const context_path = (formData.get('context_path') as string) || '/panadero/ingredientes'

  if (!id || !name || !base_unit) return { error: 'Nombre y unidad base son requeridos.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('ingredients')
    .update({ name, base_unit, category_id, supplier_name, min_stock_target, prep_recipe_id })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(context_path)
  redirect(context_path)
}

// ── Add new price entry (preserves history) ───────────────────────────────────

export async function addPriceEntry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ingredient_id = formData.get('ingredient_id') as string
  const context_path = (formData.get('context_path') as string) || '/panadero/ingredientes'
  const effective_from_raw = (formData.get('effective_from') as string)?.trim()

  if (!ingredient_id) return { error: 'Ingrediente no especificado.' }

  const priceFields = parsePriceFields(formData)
  if (!priceFields) return { error: 'Datos de precio inválidos.' }

  const { presentation_name, presentation_quantity, presentation_unit, purchase_price } = priceFields

  if (!presentation_name) return { error: 'Nombre de presentación es requerido.' }
  if (!presentation_unit) return { error: 'Unidad de presentación es requerida.' }
  if (presentation_quantity <= 0) return { error: 'Cantidad de presentación debe ser mayor a 0.' }
  if (purchase_price < 0) return { error: 'El precio de compra no puede ser negativo.' }

  const supabase = await createClient()

  const { data: ing, error: ingFetchError } = await supabase
    .from('ingredients')
    .select('base_unit')
    .eq('id', ingredient_id)
    .single()

  if (ingFetchError || !ing) return { error: 'Ingrediente no encontrado.' }

  const unitPriceResult = calcUnitPriceFromPresentation(
    purchase_price, presentation_quantity, presentation_unit, ing.base_unit
  )
  if (!unitPriceResult.ok) {
    return { error: `Error de conversión: ${unitPriceResult.error}` }
  }

  const insertPayload: Record<string, unknown> = {
    ingredient_id,
    presentation_name,
    presentation_quantity,
    presentation_unit,
    purchase_price,
    unit_price: unitPriceResult.value,
  }
  if (effective_from_raw) insertPayload.effective_from = effective_from_raw

  const { error } = await supabase.from('ingredient_price_history').insert(insertPayload)

  if (error) return { error: error.message }

  const return_to = `${context_path}/${ingredient_id}/editar`
  revalidatePath(return_to)
  revalidatePath('/admin/costos')
  redirect(return_to)
}

// ── Delete a price history entry ──────────────────────────────────────────────

export async function deletePriceEntry(formData: FormData): Promise<void> {
  const entry_id = formData.get('entry_id') as string
  const ingredient_id = formData.get('ingredient_id') as string
  const context_path = (formData.get('context_path') as string) || '/panadero/insumos'

  if (!entry_id || !ingredient_id) return

  const supabase = await createClient()

  const { error } = await supabase
    .from('ingredient_price_history')
    .delete()
    .eq('id', entry_id)

  if (error) throw new Error(`Error al eliminar precio: ${error.message}`)

  const return_to = `${context_path}/${ingredient_id}/editar`
  revalidatePath(return_to)
  revalidatePath('/admin/costos')
  redirect(return_to)
}

// ── Activate / deactivate ─────────────────────────────────────────────────────

export async function deactivateIngrediente(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  const { error } = await supabase.from('ingredients').update({ active: false }).eq('id', id)
  if (error) throw new Error(`RLS/DB error al desactivar ingrediente: ${error.message} (code: ${error.code})`)
  revalidatePath('/panadero/ingredientes')
  revalidatePath('/admin/ingredientes')
  revalidatePath('/panadero/insumos')
  revalidatePath('/admin/insumos')
}

export async function reactivateIngrediente(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  const { error } = await supabase.from('ingredients').update({ active: true }).eq('id', id)
  if (error) throw new Error(`RLS/DB error al reactivar ingrediente: ${error.message} (code: ${error.code})`)
  revalidatePath('/panadero/ingredientes')
  revalidatePath('/admin/ingredientes')
  revalidatePath('/panadero/insumos')
  revalidatePath('/admin/insumos')
}

// ── Create ingredient inline from recipe form (returns data, no redirect) ────

export async function createIngredienteInline(
  _prev: InlineIngredienteResult,
  formData: FormData,
): Promise<InlineIngredienteResult> {
  const name = (formData.get('name') as string)?.trim()
  const base_unit = (formData.get('base_unit') as string)?.trim()

  if (!name || !base_unit) return { error: 'Nombre y unidad base son requeridos.' }

  const priceFields = parsePriceFields(formData)
  if (!priceFields) return { error: 'Datos de precio inválidos.' }

  const { presentation_name, presentation_quantity, presentation_unit, purchase_price } = priceFields

  if (!presentation_name) return { error: 'Nombre de presentación es requerido.' }
  if (!presentation_unit) return { error: 'Unidad de presentación es requerida.' }
  if (presentation_quantity <= 0) return { error: 'Cantidad debe ser mayor a 0.' }
  if (purchase_price < 0) return { error: 'El precio no puede ser negativo.' }

  const unitPriceResult = calcUnitPriceFromPresentation(
    purchase_price, presentation_quantity, presentation_unit, base_unit
  )
  if (!unitPriceResult.ok) {
    return { error: `Error de conversión: ${unitPriceResult.error}` }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('ingredients')
    .select('id')
    .ilike('name', name)
    .maybeSingle()

  if (existing) return { error: `Ya existe un ingrediente con nombre "${name}".` }

  const { data: ingredient, error: ingError } = await supabase
    .from('ingredients')
    .insert({ name, base_unit, active: true })
    .select('id')
    .single()

  if (ingError || !ingredient) return { error: ingError?.message ?? 'Error al crear ingrediente.' }

  const { error: priceError } = await supabase.from('ingredient_price_history').insert({
    ingredient_id: ingredient.id,
    presentation_name,
    presentation_quantity,
    presentation_unit,
    purchase_price,
    unit_price: unitPriceResult.value,
  })

  if (priceError) {
    await supabase.from('ingredients').delete().eq('id', ingredient.id)
    return { error: priceError.message }
  }

  revalidatePath('/admin/ingredientes')
  revalidatePath('/panadero/ingredientes')
  revalidatePath('/admin/insumos')
  revalidatePath('/panadero/insumos')

  return {
    error: null,
    ingredient: { id: ingredient.id, name, base_unit },
    unit_price: unitPriceResult.value,
  }
}

// ── Category CRUD ─────────────────────────────────────────────────────────────

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'El nombre es requerido.' }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('ingredient_categories')
    .select('id')
    .ilike('name', name)
    .maybeSingle()

  if (existing) return { error: `Ya existe la categoría "${name}".` }

  const { error } = await supabase
    .from('ingredient_categories')
    .insert({ name })

  if (error) return { error: error.message }

  revalidatePath('/admin/insumos/categorias')
  return { error: null }
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return

  const supabase = await createClient()

  const { count } = await supabase
    .from('ingredients')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if (count && count > 0) {
    throw new Error(`No se puede eliminar: ${count} insumo(s) usan esta categoría.`)
  }

  const { error } = await supabase
    .from('ingredient_categories')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/insumos/categorias')
}
