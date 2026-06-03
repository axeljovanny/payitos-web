'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { ActionState } from '@/lib/gastos/actions'
import type { VariableExpense } from '@/lib/gastos/types'
import { VE_CATEGORY_OPTIONS } from '@/lib/gastos/types'

interface Props {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: Partial<VariableExpense>
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

export default function GastoVariableForm({ action, defaultValues }: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null })
  const isEditing = !!defaultValues?.id

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]'

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="expense_date"
              required
              defaultValue={defaultValues?.expense_date ?? today()}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              defaultValue={defaultValues?.category ?? 'operativo'}
              className={inputClass}
            >
              {VE_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Descripción <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="description"
            required
            defaultValue={defaultValues?.description ?? ''}
            placeholder="ej. Gas LP, empaques, transporte…"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Monto (MXN) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="amount"
            required
            min="0.01"
            step="0.01"
            defaultValue={defaultValues?.amount ?? ''}
            placeholder="ej. 450.00"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Notas <span className="text-xs text-gray-400">(opcional)</span>
          </label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={defaultValues?.notes ?? ''}
            placeholder="ej. Factura #123, proveedor Casa López…"
            className={inputClass + ' resize-none'}
          />
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
          {pending ? 'Guardando…' : isEditing ? 'Actualizar gasto' : 'Guardar gasto'}
        </button>
        <Link
          href="/admin/gastos"
          className="rounded-lg border border-gray-300 text-gray-600 font-medium px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
