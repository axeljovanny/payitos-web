'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { ActionState } from '@/lib/gastos/actions'
import type { Expense } from '@/lib/gastos/types'

const FREQUENCY_OPTIONS = [
  { value: 'diario', label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'anual', label: 'Anual' },
]

interface Props {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: Partial<Expense>
}

export default function GastoForm({ action, defaultValues }: Props) {
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
            placeholder="ej. Renta del local, Gas, Electricidad…"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'operativo', label: 'Operativo', desc: 'Renta, servicios, insumos…' },
              { value: 'administrativo', label: 'Administrativo', desc: 'Contador, banco, software…' },
            ] as const).map((cat) => (
              <label
                key={cat.value}
                className="flex flex-col gap-0.5 rounded-xl border border-gray-200 bg-white px-3 py-3 cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    defaultChecked={(defaultValues?.category ?? 'operativo') === cat.value}
                    className="accent-amber-600"
                  />
                  <span className="text-sm font-semibold text-gray-800">{cat.label}</span>
                </div>
                <span className="text-xs text-gray-400 pl-5">{cat.desc}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              placeholder="ej. 5000"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Frecuencia <span className="text-red-500">*</span>
            </label>
            <select
              name="frequency"
              defaultValue={defaultValues?.frequency ?? 'mensual'}
              className={inputClass}
            >
              {FREQUENCY_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
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
            placeholder="ej. Contrato hasta dic 2025, incluye estacionamiento…"
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
