// Tipos del modelo de procesos de producción (reemplaza recipes + corridas).
// Sin imports de servidor.

export type SourceType = 'ingredient' | 'preparation'
export type AllocationMode = 'all' | 'subset'

export interface ProcessStep {
  id: string
  process_id: string
  step_name: string
  sequence_order: number
  duration_hours: number
  workers_required: number
  step_type: string
  can_overlap: boolean
  overlap_group: string | null
  active: boolean
  notes: string | null
}

export interface ProcessStepInput {
  _key?: string
  step_name: string
  sequence_order: number
  duration_hours: number
  workers_required: number
  step_type: string
  can_overlap: boolean
  overlap_group: string | null
  active: boolean
  notes: string | null
}

export interface ProcessOutput {
  id: string
  process_id: string
  product_id: string
  pieces: number
  product?: { name: string; category: string; sale_price: number; target_margin_percent: number } | null
}

export interface ProcessOutputInput {
  _key?: string
  product_id: string
  pieces: number
}

// Variante consumidora de un componente, con su porción (1 = ración completa)
export interface ComponentConsumer {
  product_id: string
  weight: number
}

export interface ProcessComponent {
  id: string
  process_id: string
  step_id: string | null
  label: string | null
  source_type: SourceType
  ingredient_id: string | null
  preparation_id: string | null
  quantity: number
  unit: string
  waste_factor_percent: number
  allocation_mode: AllocationMode
  // variantes que consumen este componente — vacío si mode='all'
  consumers: ComponentConsumer[]
}

export interface ProcessComponentInput {
  _key?: string
  label: string | null
  source_type: SourceType
  ingredient_id: string | null
  preparation_id: string | null
  quantity: number
  unit: string
  waste_factor_percent: number
  allocation_mode: AllocationMode
  consumers: ComponentConsumer[]
}

export interface ProcessDetail {
  id: string
  name: string
  cooking_type: string
  active: boolean
  notes: string | null
  labor_hours_per_batch: number | null
  calendar_time_hours: number | null
  steps: ProcessStep[]
  outputs: ProcessOutput[]
  components: ProcessComponent[]
}

export interface ProcessListItem {
  id: string
  name: string
  cooking_type: string
  active: boolean
  labor_hours_per_batch: number | null
  calendar_time_hours: number | null
  output_count: number
  total_pieces: number
}
