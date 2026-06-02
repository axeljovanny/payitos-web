'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calcUnitPriceFromPresentation } from '@/lib/costing/units'
import type { ParsedRow, BulkImportResult } from '@/lib/ingredientes/import-types'

type ImportState = { error: string | null; result?: BulkImportResult }

export async function bulkImportInsumos(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const rowsRaw = formData.get('rows') as string
  if (!rowsRaw) return { error: 'No se recibieron filas para importar.' }

  let rows: ParsedRow[]
  try {
    rows = JSON.parse(rowsRaw) as ParsedRow[]
  } catch {
    return { error: 'Formato de datos inválido.' }
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: 'No hay filas válidas para importar.' }
  }

  const supabase = await createClient()

  let created = 0
  let priceAdded = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    try {
      // Find or create ingredient
      const { data: existing } = await supabase
        .from('ingredients')
        .select('id, base_unit')
        .ilike('name', row.name)
        .maybeSingle()

      let ingredientId: string
      let baseUnit: string

      if (existing) {
        ingredientId = existing.id
        baseUnit = existing.base_unit
      } else {
        const { data: created_ing, error: createErr } = await supabase
          .from('ingredients')
          .insert({
            name: row.name,
            base_unit: row.base_unit,
            supplier_name: row.supplier_name ?? null,
            min_stock_target: row.min_stock_target ?? 0,
            active: true,
          })
          .select('id')
          .single()

        if (createErr || !created_ing) {
          errors.push(`Fila "${row.name}": error al crear — ${createErr?.message ?? 'desconocido'}`)
          continue
        }

        ingredientId = created_ing.id
        baseUnit = row.base_unit
        created++
      }

      // Insert price if price data present
      const hasPriceData = row.presentation_name && row.purchase_price != null && row.presentation_quantity && row.presentation_unit

      if (hasPriceData) {
        const unitPriceResult = calcUnitPriceFromPresentation(
          row.purchase_price!,
          row.presentation_quantity!,
          row.presentation_unit!,
          baseUnit,
        )

        if (!unitPriceResult.ok) {
          errors.push(`Fila "${row.name}": error de conversión — ${unitPriceResult.error}`)
          skipped++
          continue
        }

        const insertPayload: Record<string, unknown> = {
          ingredient_id: ingredientId,
          presentation_name: row.presentation_name,
          presentation_quantity: row.presentation_quantity,
          presentation_unit: row.presentation_unit,
          purchase_price: row.purchase_price,
          unit_price: unitPriceResult.value,
        }
        if (row.effective_from) insertPayload.effective_from = row.effective_from

        const { error: priceErr } = await supabase
          .from('ingredient_price_history')
          .insert(insertPayload)

        if (priceErr) {
          errors.push(`Fila "${row.name}": precio no guardado — ${priceErr.message}`)
        } else {
          priceAdded++
        }
      } else if (existing) {
        skipped++
      }
    } catch (err) {
      errors.push(`Fila "${row.name}": error inesperado — ${String(err)}`)
    }
  }

  revalidatePath('/admin/insumos')
  revalidatePath('/panadero/insumos')
  revalidatePath('/admin/ingredientes')
  revalidatePath('/panadero/ingredientes')

  return { error: null, result: { created, priceAdded, skipped, errors } }
}
