'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import type { ActionState } from '@/lib/gastos/actions'
import type { TeamMember } from '@/lib/gastos/types'
import { ROLE_TYPE_OPTIONS, weeklyToMonthly } from '@/lib/gastos/types'
import { formatMXN } from '@/lib/costing/format'

interface Props {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: Partial<TeamMember>
}

export default function IntegranteForm({ action, defaultValues }: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null })
  const isEditing = !!defaultValues?.id

  const [weeklyWage, setWeeklyWage] = useState(
    defaultValues?.current_weekly_wage != null ? String(defaultValues.current_weekly_wage) : ''
  )

  const monthlyPreview = weeklyWage ? weeklyToMonthly(Number(weeklyWage)) : null

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ed507c]'

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      {/* Datos personales */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos del integrante</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            defaultValue={defaultValues?.name ?? ''}
            placeholder="ej. Ana López"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tipo de rol
          </label>
          <select
            name="role_type"
            defaultValue={defaultValues?.role_type ?? ''}
            className={inputClass}
          >
            <option value="">Sin especificar</option>
            {ROLE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Notas <span className="text-xs text-gray-400">(opcional)</span>
          </label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={defaultValues?.notes ?? ''}
            placeholder="ej. Horario especial, prestaciones adicionales…"
            className={inputClass + ' resize-none'}
          />
        </div>
      </div>

      {/* Horas de trabajo */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Horas de trabajo / semana</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Horas producción</label>
            <input
              type="number"
              name="production_hours_per_week"
              min="0"
              step="0.5"
              defaultValue={defaultValues?.production_hours_per_week ?? 0}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Horas venta</label>
            <input
              type="number"
              name="sales_hours_per_week"
              min="0"
              step="0.5"
              defaultValue={defaultValues?.sales_hours_per_week ?? 0}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Sueldo */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sueldo</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Sueldo semanal actual (MXN) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="current_weekly_wage"
            min="0"
            step="0.01"
            value={weeklyWage}
            onChange={(e) => setWeeklyWage(e.target.value)}
            placeholder="ej. 1800"
            className={inputClass}
          />
          {monthlyPreview != null && monthlyPreview > 0 && (
            <p className="mt-1.5 text-xs text-[#d43a6a] bg-pink-50 rounded-lg px-3 py-2">
              ≈ {formatMXN(monthlyPreview)} / mes
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Sueldo semanal objetivo <span className="text-xs text-gray-400">(opcional)</span>
          </label>
          <input
            type="number"
            name="target_weekly_salary"
            min="0"
            step="0.01"
            defaultValue={defaultValues?.target_weekly_salary ?? ''}
            placeholder="ej. 2500"
            className={inputClass}
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
          {pending ? 'Guardando…' : isEditing ? 'Actualizar integrante' : 'Guardar integrante'}
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
