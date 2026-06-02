'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type ActionState = { error: string | null }

interface IngredientInput {
  ingredient_id: string
  quantity: number
  unit: string
  waste_factor_percent: number
}

function parseIngredients(json: string | null): IngredientInput[] | null {
  if (!json) return []
  try {
    const parsed = JSON.parse(json) as unknown[]
    if (!Array.isArray(parsed)) return null
    return parsed.map((row) => {
      const r = row as Record<string, unknown>
      return {
        ingredient_id: String(r.ingredient_id ?? ''),
        quantity: Number(r.quantity ?? 0),
        unit: String(r.unit ?? ''),
        waste_factor_percent: Number(r.waste_factor_percent ?? 0),
      }
    })
  } catch {
    return null
  }
}

function validateIngredients(ingredients: IngredientInput[]): string | null {
  if (ingredients.length === 0) return null
  for (const ing of ingredients) {
    if (!ing.ingredient_id) return 'Selecciona un ingrediente en cada fila.'
    if (!ing.unit) return 'Indica la unidad de cada ingrediente.'
    if (ing.quantity <= 0) return 'La cantidad de cada ingrediente debe ser mayor a 0.'
  }
  return null
}

export async function createReceta(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const product_id = formData.get('product_id') as string
  const batch_yield = Number(formData.get('batch_yield'))
  const yield_unit = (formData.get('yield_unit') as string)?.trim() || 'pza'
  const production_time_hours = Number(formData.get('production_time_hours'))
  const cooking_type = formData.get('cooking_type') as string
  const context_path = (formData.get('context_path') as string) || '/panadero/recetas'

  if (!product_id || batch_yield <= 0 || production_time_hours <= 0 || !cooking_type) {
    return { error: 'Completa todos los campos requeridos con valores válidos.' }
  }

  const ingredients = parseIngredients(formData.get('ingredients_json') as string)
  if (ingredients === null) return { error: 'Datos de ingredientes inválidos.' }
  const ingError = validateIngredients(ingredients)
  if (ingError) return { error: ingError }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('recipes')
    .select('id')
    .eq('product_id', product_id)
    .eq('active', true)
    .maybeSingle()

  if (existing) {
    return {
      error: 'Ya existe una receta activa para este producto. Desactívala primero o usa Editar.',
    }
  }

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({ product_id, batch_yield, yield_unit, production_time_hours, cooking_type, active: true })
    .select('id')
    .single()

  if (recipeError || !recipe) {
    return { error: recipeError?.message ?? 'Error al guardar la receta.' }
  }

  if (ingredients.length > 0) {
    const rows = ingredients.map((ing) => ({
      recipe_id: recipe.id,
      ingredient_id: ing.ingredient_id,
      quantity: ing.quantity,
      unit: ing.unit,
      waste_factor_percent: ing.waste_factor_percent,
    }))
    const { error: ingError } = await supabase.from('recipe_ingredients').insert(rows)
    if (ingError) {
      await supabase.from('recipes').delete().eq('id', recipe.id)
      return { error: ingError.message }
    }
  }

  revalidatePath(context_path)
  redirect(context_path)
}

export async function updateReceta(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string
  const product_id = formData.get('product_id') as string
  const batch_yield = Number(formData.get('batch_yield'))
  const yield_unit = (formData.get('yield_unit') as string)?.trim() || 'pza'
  const production_time_hours = Number(formData.get('production_time_hours'))
  const cooking_type = formData.get('cooking_type') as string
  const context_path = (formData.get('context_path') as string) || '/panadero/recetas'

  if (!id || !product_id || batch_yield <= 0 || production_time_hours <= 0 || !cooking_type) {
    return { error: 'Completa todos los campos requeridos con valores válidos.' }
  }

  const ingredients = parseIngredients(formData.get('ingredients_json') as string)
  if (ingredients === null) return { error: 'Datos de ingredientes inválidos.' }
  const ingError = validateIngredients(ingredients)
  if (ingError) return { error: ingError }

  const supabase = await createClient()

  // active: true — reactivar si estaba inactiva (el único constraint impide crear nueva)
  const { error: updateError } = await supabase
    .from('recipes')
    .update({ product_id, batch_yield, yield_unit, production_time_hours, cooking_type, active: true })
    .eq('id', id)

  if (updateError) return { error: updateError.message }

  const { error: deleteError } = await supabase
    .from('recipe_ingredients')
    .delete()
    .eq('recipe_id', id)

  if (deleteError) return { error: deleteError.message }

  if (ingredients.length > 0) {
    const rows = ingredients.map((ing) => ({
      recipe_id: id,
      ingredient_id: ing.ingredient_id,
      quantity: ing.quantity,
      unit: ing.unit,
      waste_factor_percent: ing.waste_factor_percent,
    }))
    const { error: ingInsertError } = await supabase.from('recipe_ingredients').insert(rows)
    if (ingInsertError) return { error: ingInsertError.message }
  }

  revalidatePath(context_path)
  redirect(context_path)
}

export async function deactivateReceta(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  const { error } = await supabase.from('recipes').update({ active: false }).eq('id', id)
  if (error) throw new Error(`RLS/DB error al desactivar receta: ${error.message} (code: ${error.code})`)
  revalidatePath('/panadero/recetas')
  revalidatePath('/admin/productos', 'layout')
}

export async function reactivateReceta(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  const { error } = await supabase.from('recipes').update({ active: true }).eq('id', id)
  if (error) throw new Error(`RLS/DB error al reactivar receta: ${error.message} (code: ${error.code})`)
  revalidatePath('/panadero/recetas')
  revalidatePath('/admin/productos', 'layout')
}
