'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type ActionState = { error: string | null }

export async function createProducto(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = (formData.get('name') as string)?.trim()
  const category = ((formData.get('category') as string) ?? '').trim()
  const sale_price = Number(formData.get('sale_price'))
  const target_margin_percent = Number(formData.get('target_margin_percent') ?? 30)
  const default_batch_yield = Number(formData.get('default_batch_yield') ?? 1)
  const production_time_hours = Number(formData.get('production_time_hours') ?? 1)
  const cooking_type = formData.get('cooking_type') as string

  if (!name || sale_price <= 0 || !cooking_type) {
    return { error: 'Nombre, precio de venta y tipo de cocción son requeridos.' }
  }

  const supabase = await createClient()

  // Check for a soft-deleted product with the same name and reactivate it
  const { data: existing } = await supabase
    .from('products')
    .select('id, active')
    .ilike('name', name)
    .maybeSingle()

  if (existing) {
    if (existing.active) {
      return { error: `Ya existe un producto activo con el nombre "${name}". Usa otro nombre o edita el existente.` }
    }
    // Reactivate the soft-deleted product with the new values
    const { error: reactError } = await supabase
      .from('products')
      .update({ name, category, sale_price, target_margin_percent, default_batch_yield, production_time_hours, cooking_type, active: true })
      .eq('id', existing.id)
    if (reactError) return { error: reactError.message }
    revalidatePath('/admin/productos')
    redirect('/admin/productos')
  }

  const { error } = await supabase.from('products').insert({
    name,
    category,
    sale_price,
    target_margin_percent,
    default_batch_yield,
    production_time_hours,
    cooking_type,
    active: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/productos')
  redirect('/admin/productos')
}

export async function updateProducto(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const category = ((formData.get('category') as string) ?? '').trim()
  const sale_price = Number(formData.get('sale_price'))
  const target_margin_percent = Number(formData.get('target_margin_percent') ?? 30)
  const default_batch_yield = Number(formData.get('default_batch_yield') ?? 1)
  const production_time_hours = Number(formData.get('production_time_hours') ?? 1)
  const cooking_type = formData.get('cooking_type') as string

  if (!id || !name || sale_price <= 0 || !cooking_type) {
    return { error: 'Nombre, precio de venta y tipo de cocción son requeridos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ name, category, sale_price, target_margin_percent, default_batch_yield, production_time_hours, cooking_type })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/productos')
  revalidatePath(`/admin/productos/${id}`)
  revalidatePath('/admin/costos')
  redirect(`/admin/productos/${id}`)
}

export async function deleteProducto(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()

  // Quitar el producto de cualquier proceso que lo produzca (cascade limpia consumers).
  // No se borra el proceso — puede producir otras variantes.
  await supabase.from('process_outputs').delete().eq('product_id', id)
  // Componentes que apuntan a este producto como insumo (no aplica; insumos son ingredients)
  await supabase.from('product_stock').delete().eq('product_id', id)

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(`No se pudo eliminar el producto: ${error.message}`)

  revalidatePath('/admin/productos')
  redirect('/admin/productos')
}

export async function deactivateProducto(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('products').update({ active: false }).eq('id', id)
  revalidatePath('/admin/productos')
  revalidatePath('/admin/costos')
}

export async function reactivateProducto(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return
  const supabase = await createClient()
  await supabase.from('products').update({ active: true }).eq('id', id)
  revalidatePath('/admin/productos')
  revalidatePath('/admin/costos')
}
