'use client'

import { useActionState, useState, useMemo } from 'react'
import { addPriceEntry } from '@/lib/ingredientes/actions'
import { calcUnitPriceFromPresentation } from '@/lib/costing/units'
import { formatUnitPrice, UNIT_OPTIONS } from '@/lib/costing/format'

interface Props {
  ingredientId: string
  baseUnit: string
  basePath?: string
}

export default function PriceEntryForm({ ingredientId, baseUnit, basePath }: Props) {
  const [state, formAction, pending] = useActionState(addPriceEntry, { error: null })

  const [presentationUnit, setPresentationUnit] = useState('kg')
  const [presentationQty, setPresentationQty] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')

  const unitPricePreview = useMemo(() => {
    const qty = Number(presentationQty)
    const price = Number(purchasePrice)
    if (!qty || !price) return null
    return calcUnitPriceFromPresentation(price, qty, presentationUnit, baseUnit)
  }, [presentationQty, purchasePrice, presentationUnit, baseUnit])

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400'

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="ingredient_id" value={ingredientId} />
      <input type="hidden" name="context_path" value={basePath ?? '/panadero/ingredientes'} />

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Presentación</label>
        <input
          type="text"
          name="presentation_name"
          required
          placeholder="ej. Costal 50 kg"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
          <input
            type="number"
            name="presentation_quantity"
            min="0.001"
            step="any"
            required
            placeholder="50"
            value={presentationQty}
            onChange={(e) => setPresentationQty(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Unidad</label>
          <select
            name="presentation_unit"
            value={presentationUnit}
            onChange={(e) => setPresentationUnit(e.target.value)}
            className={inputClass}
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Precio de compra (MXN)
        </label>
        <input
          type="number"
          name="purchase_price"
          min="0"
          step="0.01"
          required
          placeholder="280.00"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Vigente desde (opcional)
        </label>
        <input
          type="date"
          name="effective_from"
          className={inputClass}
        />
      </div>

      {unitPricePreview && (
        <div
          className={`rounded-lg px-3 py-2 text-xs font-medium ${
            unitPricePreview.ok
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {unitPricePreview.ok
            ? `≈ ${formatUnitPrice(unitPricePreview.value)} por ${baseUnit}`
            : unitPricePreview.error}
        </div>
      )}

      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-amber-300 text-amber-700 font-medium py-2 text-sm hover:bg-amber-50 transition-colors disabled:opacity-60"
      >
        {pending ? 'Guardando…' : 'Agregar precio'}
      </button>
    </form>
  )
}
