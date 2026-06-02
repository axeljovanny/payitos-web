export interface ParsedRow {
  name: string
  base_unit: string
  supplier_name?: string
  min_stock_target?: number
  presentation_name?: string
  presentation_quantity?: number
  presentation_unit?: string
  purchase_price?: number
  effective_from?: string
}

export interface BulkImportResult {
  created: number
  priceAdded: number
  skipped: number
  errors: string[]
}
