import { createClient } from '@/lib/supabase/server'
import type { ProductRow } from '@/lib/costing/types'

export type { ProductRow }

export interface ProductProcessSummary {
  process_id: string
  process_name: string
  pieces: number              // piezas de ESTE producto por corrida
  cooking_type: string
  calendar_time_hours: number | null
  labor_hours_per_batch: number | null
  output_count: number        // nº de variantes que produce la corrida
}

export async function fetchProductos(): Promise<ProductRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select(
      'id, name, category, active, sale_price, target_margin_percent, default_batch_yield, production_time_hours, cooking_type'
    )
    .order('active', { ascending: false })
    .order('name')
  return (data ?? []) as ProductRow[]
}

export async function fetchProductoById(id: string): Promise<ProductRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select(
      'id, name, category, active, sale_price, target_margin_percent, default_batch_yield, production_time_hours, cooking_type'
    )
    .eq('id', id)
    .maybeSingle()
  return data as ProductRow | null
}

// Proceso activo que produce este producto (reemplaza la receta 1:1)
export async function fetchProcessForProduct(
  productId: string
): Promise<ProductProcessSummary | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('process_outputs')
    .select('pieces, processes!inner(id, name, cooking_type, active, calendar_time_hours, labor_hours_per_batch, process_outputs(id))')
    .eq('product_id', productId)
    .eq('processes.active', true)
    .limit(1)
    .maybeSingle()

  if (!data) return null

  const raw = data as unknown as {
    pieces: number
    processes: {
      id: string; name: string; cooking_type: string
      calendar_time_hours: number | null; labor_hours_per_batch: number | null
      process_outputs: { id: string }[]
    }
  }

  return {
    process_id: raw.processes.id,
    process_name: raw.processes.name,
    pieces: raw.pieces,
    cooking_type: raw.processes.cooking_type,
    calendar_time_hours: raw.processes.calendar_time_hours ?? null,
    labor_hours_per_batch: raw.processes.labor_hours_per_batch ?? null,
    output_count: raw.processes.process_outputs?.length ?? 1,
  }
}
