'use client'

import { useActionState, useState, useMemo } from 'react'
import Link from 'next/link'
import type { ActionState } from '@/lib/ingredientes/actions'
import type { CategoryOption } from '@/lib/ingredientes/queries'
import { calcUnitPriceFromPresentation } from '@/lib/costing/units'
import { formatUnitPrice, UNIT_OPTIONS } from '@/lib/costing/format'

export interface IngredienteDefaultValues {
  id?: string
  name?: string
  base_unit?: string
  category_id?: string | null
  supplier_name?: string | null
}

interface Props {
  categories: CategoryOption[]
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: IngredienteDefaultValues
  basePath?: string
  entityLabel?: string
}

export default function IngredienteForm({ categories, action, defaultValues, basePath, entityLabel = 'ingrediente' }: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null })
  const base = basePath ?? '/panadero/ingredientes'
  const isEditing = !!defaultValues?.id

  const [baseUnit, setBaseUnit] = useState(defaultValues?.base_unit ?? '')
  const [presentationUnit, setPresentationUnit] = useState('kg')
  const [presentationQty, setPresentationQty] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')

  const unitPricePreview = useMemo(() => {
    if (isEditing) return null
    const qty = Number(presentationQty)
    const price = Number(purchasePrice)
    if (!qty || !price || !baseUnit || !presentationUnit) return null
    return calcUnitPriceFromPresentation(price, qty, presentationUnit, baseUnit)
  }, [presentationQty, purchasePrice, baseUnit, presentationUnit, isEditing])

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]'

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="context_path" value={base} />
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      {/* ── Datos del ingrediente ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            defaultValue={defaultValues?.name ?? ''}
            required
            placeholder="ej. Harina de trigo"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Proveedor
          </label>
          <input
            type="text"
            name="supplier_name"
            defaultValue={defaultValues?.supplier_name ?? ''}
            placeholder="ej. Molino Azteca, Casa López…"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Unidad base <span className="text-red-500">*</span>
            </label>
            <select
              name="base_unit"
              value={baseUnit}
              onChange={(e) => setBaseUnit(e.target.value)}
              required
              className={inputClass}
            >
              <option value="" disabled>Selecciona…</option>
              {UNIT_OPTIONS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Categoría
            </label>
            <select
              name="category_id"
              defaultValue={defaultValues?.category_id ?? ''}
              className={inputClass}
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Precio inicial (solo al crear) ── */}
      {!isEditing && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Precio inicial</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Presentación <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="presentation_name"
              required
              placeholder="ej. Costal 50 kg"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cantidad <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="presentation_quantity"
                min="0.001"
                step="any"
                required
                placeholder="ej. 50"
                value={presentationQty}
                onChange={(e) => setPresentationQty(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Unidad pres. <span className="text-red-500">*</span>
              </label>
              <select
                name="presentation_unit"
                value={presentationUnit}
                onChange={(e) => setPresentationUnit(e.target.value)}
                required
                className={inputClass}
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Precio de compra (MXN) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="purchase_price"
              min="0"
              step="0.01"
              required
              placeholder="ej. 280.00"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className={inputClass}
            />
          </div>

          {unitPricePreview && (
            <div
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                unitPricePreview.ok
                  ? 'bg-pink-50 text-[#b02558] border border-pink-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {unitPricePreview.ok
                ? `≈ ${formatUnitPrice(unitPricePreview.value)} por ${baseUnit}`
                : unitPricePreview.error}
            </div>
          )}
        </div>
      )}


      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-[#ed507c] hover:bg-[#d43a6a] text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-60"
        >
          {pending ? 'Guardando…' : isEditing ? `Actualizar ${entityLabel}` : `Guardar ${entityLabel}`}
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
