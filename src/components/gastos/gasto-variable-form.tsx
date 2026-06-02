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

export default function GastoVariableForm({ action, defaultValues }: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null })
  const isEditing = !!defaultValues?.id

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400'

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
            placeholder="ej. Gas LP hornos, Empaques, Internet"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {VE_CATEGORY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex flex-col gap-0.5 rounded-xl border border-gray-200 bg-white px-3 py-3 cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    value={opt.value}
                    defaultChecked={(defaultValues?.category ?? 'operativo') === opt.value}
                    className="accent-amber-600"
                  />
                  <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                </div>
                <span className="text-xs text-gray-400 pl-5">{opt.hint}</span>
              </label>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          Llena uno o ambos montos. El costo por hora se multiplica por las horas mensuales de producción (160h) para calcular el overhead.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Costo por hora de producción (MXN)
            </label>
            <input
              type="number"
              name="amount_per_hour"
              min="0"
              step="0.01"
              defaultValue={defaultValues?.amount_per_hour ?? ''}
              placeholder="ej. 3.50"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Monto fijo mensual (MXN)
            </label>
            <input
              type="number"
              name="amount_fixed"
              min="0"
              step="0.01"
              defaultValue={defaultValues?.amount_fixed ?? ''}
              placeholder="ej. 800"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Notas <span className="text-xs text-gray-400">(opcional)</span>
          </label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={defaultValues?.notes ?? ''}
            placeholder="ej. Promedio últimos 3 meses, pendiente ajustar…"
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
          className="flex-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-60"
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
