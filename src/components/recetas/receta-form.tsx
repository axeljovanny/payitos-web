'use client'

import { useActionState, useState, useMemo } from 'react'
import Link from 'next/link'
import type { ActionState } from '@/lib/recetas/actions'
import type { ProductOption } from '@/lib/recetas/queries'
import type { IngredientRow } from '@/lib/costing/types'
import { calcLineCost } from '@/lib/costing/units'
import { formatMXN, formatUnitPrice } from '@/lib/costing/format'

const COOKING_TYPES = [
  { value: 'horno', label: 'Horno' },
  { value: 'estufa', label: 'Estufa' },
  { value: 'frio', label: 'Frío' },
  { value: 'otro', label: 'Otro' },
]

const UNIT_OPTIONS = ['g', 'kg', 'mg', 'ml', 'l', 'lt', 'pza', 'taza', 'cdita', 'cda']

interface IngRow {
  _key: string
  ingredient_id: string
  quantity: string
  unit: string
  waste_factor_percent: string
}

export interface RecetaDefaultValues {
  id?: string
  product_id?: string
  batch_yield?: number
  yield_unit?: string
  production_time_hours?: number
  cooking_type?: string
  ingredients?: Array<{
    id: string
    ingredient_id: string
    quantity: number
    unit: string
    waste_factor_percent: number
  }>
}

interface Props {
  products: ProductOption[]
  ingredients: IngredientRow[]
  prices?: Record<string, { unitPrice: number; baseUnit: string }>
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: RecetaDefaultValues
  basePath?: string
}

function newRow(): IngRow {
  return {
    _key: Math.random().toString(36).slice(2),
    ingredient_id: '',
    quantity: '',
    unit: 'g',
    waste_factor_percent: '0',
  }
}

export default function RecetaForm({ products, ingredients, prices, action, defaultValues, basePath }: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null })
  const base = basePath ?? '/panadero/recetas'

  const [rows, setRows] = useState<IngRow[]>(() => {
    if (defaultValues?.ingredients?.length) {
      return defaultValues.ingredients.map((ing) => ({
        _key: Math.random().toString(36).slice(2),
        ingredient_id: ing.ingredient_id,
        quantity: String(ing.quantity),
        unit: ing.unit,
        waste_factor_percent: String(ing.waste_factor_percent),
      }))
    }
    return [newRow()]
  })

  const [batchYield, setBatchYield] = useState(String(defaultValues?.batch_yield ?? ''))
  const [yieldUnit, setYieldUnit] = useState(defaultValues?.yield_unit ?? 'pza')

  function updateRow(key: string, field: keyof Omit<IngRow, '_key'>, value: string) {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)))
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r._key !== key) : prev))
  }

  const ingredientsPayload = rows.map(({ ingredient_id, quantity, unit, waste_factor_percent }) => ({
    ingredient_id,
    quantity: Number(quantity),
    unit,
    waste_factor_percent: Number(waste_factor_percent),
  }))

  // Per-row cost computation
  const rowCosts = useMemo(() => {
    if (!prices) return {} as Record<string, number | null>
    const result: Record<string, number | null> = {}
    for (const row of rows) {
      if (!row.ingredient_id || !row.quantity || !row.unit) {
        result[row._key] = null
        continue
      }
      const price = prices[row.ingredient_id]
      if (!price) { result[row._key] = null; continue }
      const conv = calcLineCost(
        Number(row.quantity), row.unit,
        Number(row.waste_factor_percent),
        price.unitPrice, price.baseUnit,
      )
      result[row._key] = conv.ok ? conv.value : null
    }
    return result
  }, [rows, prices])

  const batchCost = useMemo(() => {
    const vals = Object.values(rowCosts)
    if (vals.length === 0 || vals.every((v) => v === null)) return null
    return vals.reduce<number>((sum, v) => sum + (v ?? 0), 0)
  }, [rowCosts])

  const costPerPiece = useMemo(() => {
    if (batchCost === null) return null
    const n = Number(batchYield)
    if (!n || n <= 0) return null
    return batchCost / n
  }, [batchCost, batchYield])

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]'

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="context_path" value={base} />
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}
      <input type="hidden" name="ingredients_json" value={JSON.stringify(ingredientsPayload)} />
      <input type="hidden" name="yield_unit" value={yieldUnit} />

      {/* ── Main fields ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Producto <span className="text-red-500">*</span>
          </label>
          <select name="product_id" defaultValue={defaultValues?.product_id ?? ''} required className={inputClass}>
            <option value="" disabled>Selecciona un producto…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.category}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rendimiento <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1.5">
              <input
                type="number"
                name="batch_yield"
                min="0.001"
                step="any"
                value={batchYield}
                onChange={(e) => setBatchYield(e.target.value)}
                required
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]"
              />
              <select
                value={yieldUnit}
                onChange={(e) => setYieldUnit(e.target.value)}
                className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]"
              >
                <option value="pza">pza</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tiempo (horas) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="production_time_hours"
              min="0.1"
              step="0.1"
              defaultValue={defaultValues?.production_time_hours ?? ''}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tipo de cocción <span className="text-red-500">*</span>
          </label>
          <select name="cooking_type" defaultValue={defaultValues?.cooking_type ?? ''} required className={inputClass}>
            <option value="" disabled>Selecciona…</option>
            {COOKING_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>{ct.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Ingredient rows ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Insumos</p>
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, newRow()])}
            className="text-xs font-medium text-[#d43a6a] hover:text-[#8b1a42]"
          >
            + Agregar
          </button>
        </div>

        {rows.map((row, i) => {
          const lineCost = rowCosts[row._key] ?? null

          return (
            <div key={row._key} className="space-y-2">
              {i > 0 && <div className="border-t border-gray-100 pt-1" />}

              <select
                value={row.ingredient_id}
                onChange={(e) => updateRow(row._key, 'ingredient_id', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]"
              >
                <option value="">Selecciona ingrediente…</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.prep_recipe_id ? '★ ' : ''}{ing.name} ({ing.base_unit})
                  </option>
                ))}
              </select>

              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Cant."
                  min="0"
                  step="any"
                  value={row.quantity}
                  onChange={(e) => updateRow(row._key, 'quantity', e.target.value)}
                  className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]"
                />

                <select
                  value={row.unit}
                  onChange={(e) => updateRow(row._key, 'unit', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>

                <div className="relative w-20">
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="1"
                    value={row.waste_factor_percent}
                    onChange={(e) => updateRow(row._key, 'waste_factor_percent', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 pr-5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]"
                  />
                  <span className="pointer-events-none absolute right-2 top-2.5 text-xs text-gray-400">
                    %
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeRow(row._key)}
                  disabled={rows.length === 1}
                  className="text-gray-300 hover:text-red-400 disabled:opacity-25 transition-colors px-1 text-base leading-none"
                  aria-label="Eliminar ingrediente"
                >
                  ✕
                </button>
              </div>

              {/* Cost per line */}
              {prices && row.ingredient_id && row.quantity && (
                <div className="pl-1">
                  {lineCost !== null ? (
                    <span className="text-xs text-[#d43a6a] font-medium">
                      {formatMXN(lineCost)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">sin precio</span>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Batch cost summary */}
        {prices && batchCost !== null && (
          <div className="border-t border-gray-200 pt-3 mt-1 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Costo del lote</span>
              <span className="font-semibold text-gray-800">{formatMXN(batchCost)}</span>
            </div>
            {costPerPiece !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Costo por {yieldUnit === 'pza' ? 'pieza' : yieldUnit}
                </span>
                <span className="font-semibold text-[#d43a6a]">{formatUnitPrice(costPerPiece)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* ── Submit ── */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-[#ed507c] hover:bg-[#d43a6a] text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-60"
        >
          {pending ? 'Guardando…' : 'Guardar receta'}
        </button>
        <Link
          href={base}
          className="rounded-lg border border-gray-300 text-gray-600 font-medium px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
