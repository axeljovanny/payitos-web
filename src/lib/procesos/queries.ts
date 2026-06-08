import { createClient } from '@/lib/supabase/server'
import type {
  ProcessDetail, ProcessListItem, ProcessStep, ProcessOutput, ProcessComponent,
} from './types'

export interface ProductOption {
  id: string
  name: string
  category: string
}

export async function fetchProductOptions(): Promise<ProductOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, category')
    .eq('active', true)
    .order('name')
  return (data ?? []) as ProductOption[]
}

export async function fetchProcesses(): Promise<ProcessListItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('processes')
    .select('id, name, cooking_type, active, labor_hours_per_batch, calendar_time_hours, process_outputs(pieces)')
    .order('active', { ascending: false })
    .order('name')

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((p) => {
    const outputs = (p.process_outputs as Array<{ pieces: number }> | null) ?? []
    return {
      id: p.id as string,
      name: p.name as string,
      cooking_type: p.cooking_type as string,
      active: p.active as boolean,
      labor_hours_per_batch: (p.labor_hours_per_batch as number | null) ?? null,
      calendar_time_hours: (p.calendar_time_hours as number | null) ?? null,
      output_count: outputs.length,
      total_pieces: outputs.reduce((s, o) => s + Number(o.pieces), 0),
    }
  })
}

export async function fetchProcessById(id: string): Promise<ProcessDetail | null> {
  const supabase = await createClient()

  const { data: proc } = await supabase
    .from('processes')
    .select('id, name, cooking_type, active, notes, labor_hours_per_batch, calendar_time_hours')
    .eq('id', id)
    .maybeSingle()

  if (!proc) return null

  const [stepsRes, outputsRes, componentsRes] = await Promise.all([
    supabase
      .from('process_steps')
      .select('*')
      .eq('process_id', id)
      .order('sequence_order'),
    supabase
      .from('process_outputs')
      .select('id, process_id, product_id, pieces, products(name, category, sale_price, target_margin_percent)')
      .eq('process_id', id),
    supabase
      .from('process_components')
      .select('*, process_component_consumers(output_id, weight)')
      .eq('process_id', id),
  ])

  const steps = (stepsRes.data ?? []) as ProcessStep[]

  const outputs: ProcessOutput[] = ((outputsRes.data ?? []) as unknown as Array<Record<string, unknown>>).map((o) => ({
    id: o.id as string,
    process_id: o.process_id as string,
    product_id: o.product_id as string,
    pieces: Number(o.pieces),
    product: (o.products as ProcessOutput['product']) ?? null,
  }))

  // output_id → product_id para traducir consumidores
  const outputIdToProduct = new Map(outputs.map((o) => [o.id, o.product_id]))

  const components: ProcessComponent[] = ((componentsRes.data ?? []) as unknown as Array<Record<string, unknown>>).map((c) => {
    const consumerRows = (c.process_component_consumers as Array<{ output_id: string; weight: number }> | null) ?? []
    const consumers = consumerRows
      .map((r) => {
        const product_id = outputIdToProduct.get(r.output_id)
        return product_id ? { product_id, weight: Number(r.weight ?? 1) || 1 } : null
      })
      .filter((c): c is { product_id: string; weight: number } => c !== null)
    return {
      id: c.id as string,
      process_id: c.process_id as string,
      step_id: (c.step_id as string | null) ?? null,
      label: (c.label as string | null) ?? null,
      source_type: c.source_type as ProcessComponent['source_type'],
      ingredient_id: (c.ingredient_id as string | null) ?? null,
      preparation_id: (c.preparation_id as string | null) ?? null,
      quantity: Number(c.quantity),
      unit: c.unit as string,
      waste_factor_percent: Number(c.waste_factor_percent),
      allocation_mode: c.allocation_mode as ProcessComponent['allocation_mode'],
      consumers,
    }
  })

  return {
    id: proc.id as string,
    name: proc.name as string,
    cooking_type: proc.cooking_type as string,
    active: proc.active as boolean,
    notes: (proc.notes as string | null) ?? null,
    labor_hours_per_batch: (proc.labor_hours_per_batch as number | null) ?? null,
    calendar_time_hours: (proc.calendar_time_hours as number | null) ?? null,
    steps,
    outputs,
    components,
  }
}

// Todos los procesos activos con detalle completo (para el motor de costeo).
export async function fetchActiveProcessDetails(): Promise<ProcessDetail[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('processes').select('id').eq('active', true)
  const ids = ((data ?? []) as Array<{ id: string }>).map((p) => p.id)
  const details = await Promise.all(ids.map((id) => fetchProcessById(id)))
  return details.filter((d): d is ProcessDetail => d !== null)
}

// Encuentra el proceso activo que produce un producto dado (para costeo por producto)
export async function fetchProcessIdForProduct(productId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('process_outputs')
    .select('process_id, processes!inner(active)')
    .eq('product_id', productId)
    .eq('processes.active', true)
    .limit(1)
    .maybeSingle()
  return (data?.process_id as string | undefined) ?? null
}
