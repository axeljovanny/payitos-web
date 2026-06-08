// Tipos del modelo de preparaciones (subrecetas reutilizables).
// Sin imports de servidor — seguro para cliente y servidor.

export type SourceType = 'ingredient' | 'preparation'

export interface PreparationItem {
  id: string
  preparation_id: string
  source_type: SourceType
  ingredient_id: string | null
  child_preparation_id: string | null
  quantity: number
  unit: string
  waste_factor_percent: number
}

export interface PreparationItemInput {
  source_type: SourceType
  ingredient_id: string | null
  child_preparation_id: string | null
  quantity: number
  unit: string
  waste_factor_percent: number
}

export interface Preparation {
  id: string
  name: string
  yield_quantity: number
  yield_unit: string
  active: boolean
  notes: string | null
  items: PreparationItem[]
}

export interface PreparationListItem {
  id: string
  name: string
  yield_quantity: number
  yield_unit: string
  active: boolean
  item_count: number
}

export interface PreparationOption {
  id: string
  name: string
  yield_unit: string
}
