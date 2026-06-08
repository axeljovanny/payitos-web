'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { PreparationItemInput } from './types'

export type ActionState = { error: string | null }

const BASE_PATH = '/admin/preparaciones'

// Parse interno (no exportado — los archivos 'use server' solo exportan async)
function parseItems(json: string | null): PreparationItemInput[] | null {
  if (!json) return []
  try {
    const parsed = JSON.parse(json) as unknown[]
    if (!Array.isArray(parsed)) return null
    return parsed
      .map((row) => {
        const r = row as Record<string, unknown>
        const source_type = r.source_type === 'preparation' ? 'preparation' : 'ingredient'
        return {
          source_type,
          ingredient_id: source_type === 'ingredient' ? (r.ingredient_id ? String(r.ingredient_id) : null) : null,
          child_preparation_id: source_type === 'preparation' ? (r.child_preparation_id ? String(r.child_preparation_id) : null) : null,
          quantity: Number(r.quantity ?? 0),
          unit: String(r.unit ?? ''),
          waste_factor_percent: Number(r.waste_factor_percent ?? 0),
        } as PreparationItemInput
      })
      .filter((i) =>
        (i.source_type === 'ingredient' ? !!i.ingredient_id : !!i.child_preparation_id) &&
        i.quantity > 0 && !!i.unit
      )
  } catch {
    return null
  }
}

async function saveItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  preparationId: string,
  items: PreparationItemInput[],
): Promise<string | null> {
  await supabase.from('preparation_items').delete().eq('preparation_id', preparationId)
  if (items.length === 0) return null
  const rows = items.map((i) => ({
    preparation_id: preparationId,
    source_type: i.source_type,
    ingredient_id: i.ingredient_id,
    child_preparation_id: i.child_preparation_id,
    quantity: i.quantity,
    unit: i.unit,
    waste_factor_percent: i.waste_factor_percent,
  }))
  const { error } = await supabase.from('preparation_items').insert(rows)
  return error?.message ?? null
}

export async function createPreparation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = (formData.get('name') as string)?.trim()
  const yield_quantity = Number(formData.get('yield_quantity'))
  const yield_unit = (formData.get('yield_unit') as string)?.trim() || 'pza'
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!name || yield_quantity <= 0) {
    return { error: 'Nombre y rendimiento (mayor a 0) son requeridos.' }
  }

  const items = parseItems(formData.get('items_json') as string)
  if (items === null) return { error: 'Datos de insumos inválidos.' }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('preparations').select('id, active').ilike('name', name).maybeSingle()

  let prepId: string
  if (existing) {
    const { error } = await supabase
      .from('preparations')
      .update({ name, yield_quantity, yield_unit, notes, active: true })
      .eq('id', existing.id)
    if (error) return { error: error.message }
    prepId = existing.id
  } else {
    const { data, error } = await supabase
      .from('preparations')
      .insert({ name, yield_quantity, yield_unit, notes, active: true })
      .select('id').single()
    if (error || !data) return { error: error?.message ?? 'Error al crear la preparación.' }
    prepId = data.id
  }

  const itemErr = await saveItems(supabase, prepId, items)
  if (itemErr) return { error: itemErr }

  revalidatePath(BASE_PATH)
  redirect(BASE_PATH)
}

export async function updatePreparation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const yield_quantity = Number(formData.get('yield_quantity'))
  const yield_unit = (formData.get('yield_unit') as string)?.trim() || 'pza'
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!id || !name || yield_quantity <= 0) {
    return { error: 'Nombre y rendimiento (mayor a 0) son requeridos.' }
  }

  const items = parseItems(formData.get('items_json') as string)
  if (items === null) return { error: 'Datos de insumos inválidos.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('preparations')
    .update({ name, yield_quantity, yield_unit, notes })
    .eq('id', id)
  if (error) return { error: error.message }

  const itemErr = await saveItems(supabase, id, items)
  if (itemErr) return { error: itemErr }

  revalidatePath(BASE_PATH)
  revalidatePath(`${BASE_PATH}/${id}/editar`)
  redirect(BASE_PATH)
}

export async function deletePreparation(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  // Bloquear si alguna otra preparación o proceso la usa
  const [{ count: usedInPreps }, { count: usedInProcesses }] = await Promise.all([
    supabase.from('preparation_items').select('id', { count: 'exact', head: true }).eq('child_preparation_id', id),
    supabase.from('process_components').select('id', { count: 'exact', head: true }).eq('preparation_id', id),
  ])
  if ((usedInPreps ?? 0) > 0 || (usedInProcesses ?? 0) > 0) {
    // No borrar físicamente si está en uso — desactivar
    await supabase.from('preparations').update({ active: false }).eq('id', id)
  } else {
    await supabase.from('preparation_items').delete().eq('preparation_id', id)
    await supabase.from('preparations').delete().eq('id', id)
  }
  revalidatePath(BASE_PATH)
  redirect(BASE_PATH)
}

export async function reactivatePreparation(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('preparations').update({ active: true }).eq('id', id)
  revalidatePath(BASE_PATH)
}
