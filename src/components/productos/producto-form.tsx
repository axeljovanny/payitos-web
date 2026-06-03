'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { ActionState } from '@/lib/productos/actions'
import type { ProductRow } from '@/lib/costing/types'

const COOKING_TYPES = [
  { value: 'horno', label: 'Horno' },
  { value: 'estufa', label: 'Estufa' },
  { value: 'frio', label: 'Frío' },
  { value: 'otro', label: 'Otro' },
]

interface Props {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: Partial<ProductRow>
}

export default function ProductoForm({ action, defaultValues }: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null })

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]'

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            defaultValue={defaultValues?.name ?? ''}
            placeholder="ej. Concha de vainilla"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
            <input
              type="text"
              name="category"
              defaultValue={defaultValues?.category ?? ''}
              placeholder="ej. Pan dulce"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tipo de cocción <span className="text-red-500">*</span>
            </label>
            <select
              name="cooking_type"
              required
              defaultValue={defaultValues?.cooking_type ?? ''}
              className={inputClass}
            >
              <option value="" disabled>Selecciona…</option>
              {COOKING_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Precio de venta <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-gray-400">$</span>
              <input
                type="number"
                name="sale_price"
                required
                min="0.01"
                step="0.01"
                defaultValue={defaultValues?.sale_price ?? ''}
                className={`${inputClass} pl-6`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Margen objetivo
            </label>
            <div className="relative">
              <input
                type="number"
                name="target_margin_percent"
                min="0"
                max="99"
                step="1"
                defaultValue={defaultValues?.target_margin_percent ?? 30}
                className={`${inputClass} pr-7`}
              />
              <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-gray-400">%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rendimiento est. (pzas)
            </label>
            <input
              type="number"
              name="default_batch_yield"
              min="1"
              step="1"
              defaultValue={defaultValues?.default_batch_yield ?? 1}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tiempo est. (horas)
            </label>
            <input
              type="number"
              name="production_time_hours"
              min="0.1"
              step="0.1"
              defaultValue={defaultValues?.production_time_hours ?? 1}
              className={inputClass}
            />
          </div>
        </div>
      </div>

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
          {pending ? 'Guardando…' : 'Guardar producto'}
        </button>
        <Link
          href="/admin/productos"
          className="rounded-lg border border-gray-300 text-gray-600 font-medium px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
