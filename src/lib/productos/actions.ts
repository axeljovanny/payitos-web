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
