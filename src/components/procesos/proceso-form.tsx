'use client'

import { useActionState, useState, useMemo } from 'react'
import Link from 'next/link'
import type { ActionState } from '@/lib/procesos/actions'
import type { ProcessDetail } from '@/lib/procesos/types'
import type { ProductOption } from '@/lib/procesos/queries'
import type { PreparationOption } from '@/lib/preparaciones/types'
import type { IngredientRow } from '@/lib/costing/types'
import { computeProcessCost } from '@/lib/procesos/costing'
import type { PrepCost } from '@/lib/preparaciones/costing'
import { calcLaborHours, calcCalendarHours } from '@/lib/procesos/parse'
import { formatMXN, formatUnitPrice } from '@/lib/costing/format'

const COOKING_TYPES = [
  { value: 'horno', label: 'Horno' }, { value: 'estufa', label: 'Estufa' },
  { value: 'frio', label: 'Frío' }, { value: 'otro', label: 'Otro' },
]
const STEP_TYPES = ['manual', 'automatico', 'enfriamiento', 'reposo', 'horneado']
const UNIT_OPTIONS = ['g', 'kg', 'mg', 'ml', 'l', 'lt', 'pza', 'taza', 'cdita', 'cda']

interface UnitPrice { unitPrice: number; baseUnit: string }

interface OutputRow { _key: string; product_id: string; pieces: string }
interface StepRow {
  _key: string; step_name: string; duration_hours: string; workers_required: string
  step_type: string; can_overlap: boolean; overlap_group: string
}
interface CompRow {
  _key: string; label: string; source_type: 'ingredient' | 'preparation'; ref_id: string
  quantity: string; unit: string; waste_factor_percent: string
  allocation_mode: 'all' | 'subset'; consumers: { product_id: string; weight: number }[]
}

interface Props {
  products: ProductOption[]
  ingredients: IngredientRow[]
  preparations: PreparationOption[]
  prices?: Record<string, UnitPrice>
  prepCosts?: Record<string, { unitCost: number; yieldUnit: string }>
  hourlyLaborRate?: number | null
  overheadPerHour?: number | null
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: ProcessDetail
}

const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]'
const rid = () => Math.random().toString(36).slice(2)

export default function ProcesoForm({
  products, ingredients, preparations, prices, prepCosts, hourlyLaborRate, overheadPerHour, action, defaultValues,
}: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null })

  const [name, setName] = useState(defaultValues?.name ?? '')
  const [cookingType, setCookingType] = useState(defaultValues?.cooking_type ?? '')
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')

  const [outputs, setOutputs] = useState<OutputRow[]>(() =>
    defaultValues?.outputs?.length
      ? defaultValues.outputs.map((o) => ({ _key: rid(), product_id: o.product_id, pieces: String(o.pieces) }))
      : [{ _key: rid(), product_id: '', pieces: '' }]
  )

  const [steps, setSteps] = useState<StepRow[]>(() =>
    defaultValues?.steps?.length
      ? defaultValues.steps.map((s) => ({
          _key: rid(), step_name: s.step_name, duration_hours: String(s.duration_hours),
          workers_required: String(s.workers_required), step_type: s.step_type,
          can_overlap: s.can_overlap, overlap_group: s.overlap_group ?? '',
        }))
      : []
  )

  const [comps, setComps] = useState<CompRow[]>(() =>
    defaultValues?.components?.length
      ? defaultValues.components.map((c) => ({
          _key: rid(), label: c.label ?? '', source_type: c.source_type,
          ref_id: c.source_type === 'ingredient' ? (c.ingredient_id ?? '') : (c.preparation_id ?? ''),
          quantity: String(c.quantity), unit: c.unit, waste_factor_percent: String(c.waste_factor_percent),
          allocation_mode: c.allocation_mode, consumers: c.consumers,
        }))
      : []
  )

  // ── Payloads ──
  const outputsPayload = outputs
    .map((o) => ({ product_id: o.product_id, pieces: Number(o.pieces) }))
    .filter((o) => o.product_id && o.pieces > 0)

  const stepsPayload = steps.map((s, i) => ({
    step_name: s.step_name, sequence_order: i + 1,
    duration_hours: Number(s.duration_hours) || 0, workers_required: Number(s.workers_required) || 1,
    step_type: s.step_type || 'manual', can_overlap: s.can_overlap,
    overlap_group: s.can_overlap && s.overlap_group ? s.overlap_group : null,
    active: true, notes: null,
  }))

  const compsPayload = comps
    .map((c) => ({
      label: c.label || null, source_type: c.source_type,
      ingredient_id: c.source_type === 'ingredient' ? c.ref_id || null : null,
      preparation_id: c.source_type === 'preparation' ? c.ref_id || null : null,
      quantity: Number(c.quantity), unit: c.unit, waste_factor_percent: Number(c.waste_factor_percent) || 0,
      allocation_mode: c.allocation_mode,
      consumers: c.allocation_mode === 'subset' ? c.consumers : [],
    }))
    .filter((c) => (c.source_type === 'ingredient' ? c.ingredient_id : c.preparation_id) && c.quantity > 0 && c.unit)

  // ── Cost preview ──
  const prepCostMap = useMemo(() => {
    const m = new Map<string, PrepCost>()
    if (prepCosts) for (const [id, c] of Object.entries(prepCosts)) {
      m.set(id, { ok: true, batchCost: 0, unitCost: c.unitCost, yieldUnit: c.yieldUnit, missing: [] })
    }
    return m
  }, [prepCosts])

  const cost = useMemo(() => computeProcessCost({
    outputs: outputsPayload,
    components: compsPayload,
    laborHours: calcLaborHours(stepsPayload),
    calendarHours: calcCalendarHours(stepsPayload),
    prices: prices ?? {},
    prepCosts: prepCostMap,
    hourlyLaborRate: hourlyLaborRate ?? null,
    overheadPerHour: overheadPerHour ?? null,
  }), [outputsPayload, compsPayload, stepsPayload, prices, prepCostMap, hourlyLaborRate, overheadPerHour])

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? '—'

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="cooking_type" value={cookingType} />
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="outputs_json" value={JSON.stringify(outputsPayload)} />
      <input type="hidden" name="steps_json" value={JSON.stringify(stepsPayload)} />
      <input type="hidden" name="components_json" value={JSON.stringify(compsPayload)} />

      {/* ── Datos ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del proceso <span className="text-red-500">*</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Corrida de Pays" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de cocción</label>
          <select value={cookingType} onChange={(e) => setCookingType(e.target.value)} className={inputCls}>
            <option value="">Selecciona…</option>
            {COOKING_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Variantes / distribución ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Variantes producidas</p>
            <p className="text-xs text-gray-400 mt-0.5">Productos finales y piezas por corrida.</p>
          </div>
          <button type="button" onClick={() => setOutputs((p) => [...p, { _key: rid(), product_id: '', pieces: '' }])} className="text-xs font-medium text-[#d43a6a] hover:text-[#8b1a42]">+ Agregar</button>
        </div>
        {outputs.map((o) => (
          <div key={o._key} className="flex gap-2 items-center">
            <select value={o.product_id} onChange={(e) => setOutputs((p) => p.map((x) => x._key === o._key ? { ...x, product_id: e.target.value } : x))} className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]">
              <option value="">Producto…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" placeholder="Pzas" min="1" step="1" value={o.pieces} onChange={(e) => setOutputs((p) => p.map((x) => x._key === o._key ? { ...x, pieces: e.target.value } : x))} className="w-24 rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]" />
            <button type="button" onClick={() => setOutputs((p) => p.length > 1 ? p.filter((x) => x._key !== o._key) : p)} className="text-gray-300 hover:text-red-400 disabled:opacity-25 px-1 text-base">✕</button>
          </div>
        ))}
        {cost.total_pieces > 0 && <p className="text-xs text-gray-500 text-right">Total: {cost.total_pieces} piezas</p>}
      </div>

      {/* ── Pasos (tiempo / MO) ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Pasos de producción</p>
            <p className="text-xs text-gray-400 mt-0.5">Tiempo calendario y horas-hombre.</p>
          </div>
          <button type="button" onClick={() => setSteps((p) => [...p, { _key: rid(), step_name: '', duration_hours: '', workers_required: '1', step_type: 'manual', can_overlap: false, overlap_group: '' }])} className="text-xs font-medium text-[#d43a6a] hover:text-[#8b1a42]">+ Agregar</button>
        </div>
        {steps.map((s, i) => (
          <div key={s._key} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#ed507c] text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <input placeholder="Nombre del paso…" value={s.step_name} onChange={(e) => setSteps((p) => p.map((x) => x._key === s._key ? { ...x, step_name: e.target.value } : x))} className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ed507c]" />
              <button type="button" onClick={() => setSteps((p) => p.filter((x) => x._key !== s._key))} className="text-gray-300 hover:text-red-400 px-1 text-sm">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="Duración (h)" min="0.01" step="any" value={s.duration_hours} onChange={(e) => setSteps((p) => p.map((x) => x._key === s._key ? { ...x, duration_hours: e.target.value } : x))} className={inputCls} />
              <input type="number" placeholder="Personas" min="0.5" step="0.5" value={s.workers_required} onChange={(e) => setSteps((p) => p.map((x) => x._key === s._key ? { ...x, workers_required: e.target.value } : x))} className={inputCls} />
              <select value={s.step_type} onChange={(e) => setSteps((p) => p.map((x) => x._key === s._key ? { ...x, step_type: e.target.value } : x))} className={inputCls}>
                {STEP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        ))}
        {(cost.labor_hours > 0 || cost.calendar_hours > 0) && (
          <div className="flex gap-4 text-sm justify-end pt-1">
            <span className="text-gray-500">Calendario: <strong className="text-gray-800">{cost.calendar_hours} h</strong></span>
            <span className="text-gray-500">Horas-hombre: <strong className="text-[#d43a6a]">{cost.labor_hours} h-h</strong></span>
          </div>
        )}
      </div>

      {/* ── Componentes (insumos / preparaciones) ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Componentes (fases / insumos)</p>
            <p className="text-xs text-gray-400 mt-0.5">Cada uno se reparte entre las variantes que lo consumen.</p>
          </div>
          <button type="button" onClick={() => setComps((p) => [...p, { _key: rid(), label: '', source_type: 'preparation', ref_id: '', quantity: '', unit: 'kg', waste_factor_percent: '0', allocation_mode: 'all', consumers: [] }])} className="text-xs font-medium text-[#d43a6a] hover:text-[#8b1a42]">+ Agregar</button>
        </div>

        {comps.map((c) => (
          <div key={c._key} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
            <div className="flex gap-2">
              <input placeholder="Etiqueta (Masa, Queso…)" value={c.label} onChange={(e) => setComps((p) => p.map((x) => x._key === c._key ? { ...x, label: e.target.value } : x))} className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ed507c]" />
              <button type="button" onClick={() => setComps((p) => p.filter((x) => x._key !== c._key))} className="text-gray-300 hover:text-red-400 px-1 text-sm">✕</button>
            </div>
            <div className="flex gap-2">
              <select value={c.source_type} onChange={(e) => setComps((p) => p.map((x) => x._key === c._key ? { ...x, source_type: e.target.value as CompRow['source_type'], ref_id: '' } : x))} className="w-32 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ed507c]">
                <option value="preparation">Preparación</option>
                <option value="ingredient">Insumo</option>
              </select>
              <select value={c.ref_id} onChange={(e) => setComps((p) => p.map((x) => x._key === c._key ? { ...x, ref_id: e.target.value } : x))} className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ed507c]">
                <option value="">{c.source_type === 'preparation' ? 'Preparación…' : 'Insumo…'}</option>
                {c.source_type === 'preparation'
                  ? preparations.map((pr) => <option key={pr.id} value={pr.id}>{pr.name} ({pr.yield_unit})</option>)
                  : ingredients.map((ing) => <option key={ing.id} value={ing.id}>{ing.name} ({ing.base_unit})</option>)}
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <input type="number" placeholder="Cant." min="0" step="any" value={c.quantity} onChange={(e) => setComps((p) => p.map((x) => x._key === c._key ? { ...x, quantity: e.target.value } : x))} className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ed507c]" />
              <select value={c.unit} onChange={(e) => setComps((p) => p.map((x) => x._key === c._key ? { ...x, unit: e.target.value } : x))} className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ed507c]">
                {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <div className="relative w-16">
                <input type="number" placeholder="0" min="0" max="100" step="1" value={c.waste_factor_percent} onChange={(e) => setComps((p) => p.map((x) => x._key === c._key ? { ...x, waste_factor_percent: e.target.value } : x))} className="w-full rounded-lg border border-gray-300 px-2 py-2 pr-5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ed507c]" />
                <span className="pointer-events-none absolute right-2 top-2.5 text-xs text-gray-400">%</span>
              </div>
            </div>
            {/* Reparto */}
            <div className="space-y-1.5">
              <div className="flex gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={c.allocation_mode === 'all'} onChange={() => setComps((p) => p.map((x) => x._key === c._key ? { ...x, allocation_mode: 'all' } : x))} className="accent-[#ed507c]" />
                  <span className="text-gray-600">Todas las variantes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={c.allocation_mode === 'subset'} onChange={() => setComps((p) => p.map((x) => x._key === c._key ? { ...x, allocation_mode: 'subset' } : x))} className="accent-[#ed507c]" />
                  <span className="text-gray-600">Solo algunas</span>
                </label>
              </div>
              {c.allocation_mode === 'subset' && (
                <div className="space-y-1 pl-1">
                  {outputsPayload.length === 0 && <span className="text-xs text-gray-400">Agrega variantes primero</span>}
                  {outputsPayload.map((o) => {
                    const consumer = c.consumers.find((x) => x.product_id === o.product_id)
                    const checked = !!consumer
                    return (
                      <div key={o.product_id} className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer flex-1 text-xs">
                          <input type="checkbox" checked={checked} onChange={(e) => setComps((p) => p.map((x) => {
                            if (x._key !== c._key) return x
                            const others = x.consumers.filter((cc) => cc.product_id !== o.product_id)
                            return e.target.checked
                              ? { ...x, consumers: [...others, { product_id: o.product_id, weight: 1 }] }
                              : { ...x, consumers: others }
                          }))} className="accent-[#ed507c]" />
                          <span className={checked ? 'text-[#d43a6a] font-medium' : 'text-gray-500'}>{productName(o.product_id)}</span>
                        </label>
                        {checked && (
                          <input
                            type="number" min="0.05" step="0.05" value={consumer!.weight}
                            title="Porción (1 = ración completa, 0.5 = media)"
                            onChange={(e) => setComps((p) => p.map((x) => x._key === c._key
                              ? { ...x, consumers: x.consumers.map((cc) => cc.product_id === o.product_id ? { ...cc, weight: Number(e.target.value) || 0 } : cc) }
                              : x))}
                            className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#ed507c]"
                          />
                        )}
                      </div>
                    )
                  })}
                  {outputsPayload.length > 0 && (
                    <p className="text-xs text-gray-400 pt-0.5">Porción: 1 = ración completa · 0.5 = media ración.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Resumen de costos ── */}
      {cost.total_pieces > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Costo de la corrida</p>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Insumos</span><span className="font-semibold text-gray-800">{formatMXN(cost.batch_material_cost)}</span></div>
          {cost.batch_labor_cost != null && <div className="flex justify-between text-sm"><span className="text-gray-500">Mano de obra ({cost.labor_hours} h-h)</span><span className="font-semibold text-gray-800">{formatMXN(cost.batch_labor_cost)}</span></div>}
          {cost.batch_overhead_cost != null && <div className="flex justify-between text-sm"><span className="text-gray-500">Indirectos</span><span className="font-semibold text-gray-800">{formatMXN(cost.batch_overhead_cost)}</span></div>}
          {cost.batch_total_cost != null && <div className="flex justify-between text-sm border-t border-gray-100 pt-1.5"><span className="text-gray-600 font-medium">Total corrida</span><span className="font-bold text-[#d43a6a]">{formatMXN(cost.batch_total_cost)}</span></div>}

          <div className="border-t border-gray-100 pt-2 mt-1 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Costo por pieza</p>
            {cost.per_output.map((o) => (
              <div key={o.product_id} className="flex justify-between text-sm">
                <span className="text-gray-500">{productName(o.product_id)} <span className="text-gray-400">×{o.pieces}</span></span>
                <span className="font-semibold text-gray-800">{o.cost_per_piece != null ? formatUnitPrice(o.cost_per_piece) : '—'}</span>
              </div>
            ))}
          </div>

          {cost.missing.length > 0 && (
            <p className="text-xs text-amber-600 pt-1">Faltan precios: {[...new Set(cost.missing)].join(', ')}</p>
          )}
        </div>
      )}

      {state.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-[#ed507c] hover:bg-[#d43a6a] text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-60">{pending ? 'Guardando…' : 'Guardar proceso'}</button>
        <Link href="/admin/procesos" className="rounded-lg border border-gray-300 text-gray-600 font-medium px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">Cancelar</Link>
      </div>
    </form>
  )
}
