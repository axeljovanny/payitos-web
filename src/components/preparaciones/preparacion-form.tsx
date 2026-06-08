'use client'

import { useActionState, useState, useMemo } from 'react'
import Link from 'next/link'
import type { ActionState } from '@/lib/preparaciones/actions'
import type { Preparation, PreparationItemInput, PreparationOption } from '@/lib/preparaciones/types'
import type { IngredientRow } from '@/lib/costing/types'
import { calcLineCost } from '@/lib/costing/units'
import { formatMXN, formatUnitPrice } from '@/lib/costing/format'

const UNIT_OPTIONS = ['g', 'kg', 'mg', 'ml', 'l', 'lt', 'pza', 'taza', 'cdita', 'cda']

interface UnitPrice { unitPrice: number; baseUnit: string }
interface PrepCostInfo { unitCost: number; yieldUnit: string }

interface ItemRow {
  _key: string
  source_type: 'ingredient' | 'preparation'
  ref_id: string
  quantity: string
  unit: string
  waste_factor_percent: string
}

export interface PreparacionDefaultValues {
  id?: string
  name?: string
  yield_quantity?: number
  yield_unit?: string
  notes?: string | null
  items?: Preparation['items']
}

interface Props {
  ingredients: IngredientRow[]
  preparations: PreparationOption[]
  prices?: Record<string, UnitPrice>
  prepCosts?: Record<string, PrepCostInfo>
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: PreparacionDefaultValues
}

function newRow(): ItemRow {
  return { _key: Math.random().toString(36).slice(2), source_type: 'ingredient', ref_id: '', quantity: '', unit: 'g', waste_factor_percent: '0' }
}

const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]'

export default function PreparacionForm({ ingredients, preparations, prices, prepCosts, action, defaultValues }: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null })

  const [name, setName] = useState(defaultValues?.name ?? '')
  const [yieldQty, setYieldQty] = useState(String(defaultValues?.yield_quantity ?? ''))
  const [yieldUnit, setYieldUnit] = useState(defaultValues?.yield_unit ?? 'pza')
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')

  const [rows, setRows] = useState<ItemRow[]>(() => {
    if (defaultValues?.items?.length) {
      return defaultValues.items.map((it) => ({
        _key: Math.random().toString(36).slice(2),
        source_type: it.source_type,
        ref_id: it.source_type === 'ingredient' ? (it.ingredient_id ?? '') : (it.child_preparation_id ?? ''),
        quantity: String(it.quantity),
        unit: it.unit,
        waste_factor_percent: String(it.waste_factor_percent),
      }))
    }
    return [newRow()]
  })

  function updateRow(key: string, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, ...patch } : r)))
  }
  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r._key !== key) : prev))
  }

  const itemsPayload: PreparationItemInput[] = rows.map((r) => ({
    source_type: r.source_type,
    ingredient_id: r.source_type === 'ingredient' ? r.ref_id || null : null,
    child_preparation_id: r.source_type === 'preparation' ? r.ref_id || null : null,
    quantity: Number(r.quantity),
    unit: r.unit,
    waste_factor_percent: Number(r.waste_factor_percent),
  }))

  function lineCost(r: ItemRow): number | null {
    if (!r.ref_id || !r.quantity) return null
    if (r.source_type === 'ingredient') {
      const price = prices?.[r.ref_id]
      if (!price) return null
      const c = calcLineCost(Number(r.quantity), r.unit, Number(r.waste_factor_percent) || 0, price.unitPrice, price.baseUnit)
      return c.ok ? c.value : null
    }
    const pc = prepCosts?.[r.ref_id]
    if (!pc) return null
    // aproximación de preview: cantidad × costo unitario (sin conversión fina de unidades)
    return Number(r.quantity) * (1 + (Number(r.waste_factor_percent) || 0) / 100) * pc.unitCost
  }

  const batchCost = useMemo(() => {
    let total = 0; let any = false
    for (const r of rows) { const c = lineCost(r); if (c !== null) { total += c; any = true } }
    return any ? total : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, prices, prepCosts])

  const unitCost = useMemo(() => {
    if (batchCost === null) return null
    const y = Number(yieldQty)
    return y > 0 ? batchCost / y : null
  }, [batchCost, yieldQty])

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="yield_unit" value={yieldUnit} />
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="items_json" value={JSON.stringify(itemsPayload)} />

      {/* Datos */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre <span className="text-red-500">*</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Masa, Queso, Mermelada Zarzamora…" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rendimiento <span className="text-red-500">*</span></label>
            <input type="number" name="yield_quantity" min="0.001" step="any" value={yieldQty} onChange={(e) => setYieldQty(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Unidad</label>
            <select value={yieldUnit} onChange={(e) => setYieldUnit(e.target.value)} className={inputCls}>
              {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-400">El costo unitario se calcula como costo total ÷ rendimiento.</p>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Composición</p>
          <button type="button" onClick={() => setRows((p) => [...p, newRow()])} className="text-xs font-medium text-[#d43a6a] hover:text-[#8b1a42]">+ Agregar</button>
        </div>

        {rows.map((row, i) => {
          const lc = lineCost(row)
          return (
            <div key={row._key} className="space-y-2">
              {i > 0 && <div className="border-t border-gray-100 pt-1" />}
              <div className="flex gap-2">
                <select
                  value={row.source_type}
                  onChange={(e) => updateRow(row._key, { source_type: e.target.value as ItemRow['source_type'], ref_id: '' })}
                  className="w-28 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]"
                >
                  <option value="ingredient">Insumo</option>
                  <option value="preparation">Preparación</option>
                </select>
                <select
                  value={row.ref_id}
                  onChange={(e) => updateRow(row._key, { ref_id: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]"
                >
                  <option value="">{row.source_type === 'ingredient' ? 'Insumo…' : 'Preparación…'}</option>
                  {row.source_type === 'ingredient'
                    ? ingredients.map((ing) => <option key={ing.id} value={ing.id}>{ing.name} ({ing.base_unit})</option>)
                    : preparations.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.yield_unit})</option>)}
                </select>
              </div>
              <div className="flex gap-2 items-center">
                <input type="number" placeholder="Cant." min="0" step="any" value={row.quantity} onChange={(e) => updateRow(row._key, { quantity: e.target.value })} className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]" />
                <select value={row.unit} onChange={(e) => updateRow(row._key, { unit: e.target.value })} className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]">
                  {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <div className="relative w-16">
                  <input type="number" placeholder="0" min="0" max="100" step="1" value={row.waste_factor_percent} onChange={(e) => updateRow(row._key, { waste_factor_percent: e.target.value })} className="w-full rounded-lg border border-gray-300 px-2 py-2 pr-5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]" />
                  <span className="pointer-events-none absolute right-2 top-2.5 text-xs text-gray-400">%</span>
                </div>
                <button type="button" onClick={() => removeRow(row._key)} disabled={rows.length === 1} className="text-gray-300 hover:text-red-400 disabled:opacity-25 px-1 text-base leading-none">✕</button>
              </div>
              {lc !== null && <p className="text-xs text-[#d43a6a] font-medium pl-1">{formatMXN(lc)}</p>}
            </div>
          )
        })}

        {(batchCost !== null || unitCost !== null) && (
          <div className="border-t border-gray-200 pt-3 mt-1 space-y-1">
            {batchCost !== null && (
              <div className="flex justify-between text-sm"><span className="text-gray-500">Costo del lote</span><span className="font-semibold text-gray-800">{formatMXN(batchCost)}</span></div>
            )}
            {unitCost !== null && (
              <div className="flex justify-between text-sm"><span className="text-gray-500">Costo por {yieldUnit}</span><span className="font-semibold text-[#d43a6a]">{formatUnitPrice(unitCost)}</span></div>
            )}
          </div>
        )}
      </div>

      {state.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-[#ed507c] hover:bg-[#d43a6a] text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-60">{pending ? 'Guardando…' : 'Guardar preparación'}</button>
        <Link href="/admin/preparaciones" className="rounded-lg border border-gray-300 text-gray-600 font-medium px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">Cancelar</Link>
      </div>
    </form>
  )
}
