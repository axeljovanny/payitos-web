'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import type { ActionState } from '@/lib/gastos/actions'
import type { TeamMember } from '@/lib/gastos/types'
import { weeklyToMonthly } from '@/lib/gastos/types'
import { formatMXN } from '@/lib/costing/format'

interface Props {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: Partial<TeamMember>
}

export default function IntegranteForm({ action, defaultValues }: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null })
  const isEditing = !!defaultValues?.id

  const [hourlyRate, setHourlyRate] = useState(defaultValues?.current_hourly_rate?.toString() ?? '')
  const [prodHours, setProdHours] = useState(defaultValues?.production_hours_per_week?.toString() ?? '0')
  const [salesHours, setSalesHours] = useState(defaultValues?.sales_hours_per_week?.toString() ?? '0')
  const [updateWage, setUpdateWage] = useState(!isEditing)

  const totalHours = Number(prodHours) + Number(salesHours)
  const weeklyPreview = hourlyRate && totalHours ? Number(hourlyRate) * totalHours : null
  const monthlyPreview = weeklyPreview != null ? weeklyToMonthly(weeklyPreview) : null

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400'

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}
      <input type="hidden" name="update_wage" value={updateWage ? 'true' : 'false'} />

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
            Tipo de rol <span className="text-xs text-gray-400">(opcional)</span>
          </label>
          <input
            type="text"
            name="role_type"
            defaultValue={defaultValues?.role_type ?? ''}
            placeholder="ej. Panadero, Vendedor, Ayudante…"
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Horas de producción
            </label>
            <input
              type="number"
              name="production_hours_per_week"
              min="0"
              step="0.5"
              value={prodHours}
              onChange={(e) => setProdHours(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Horas de venta
            </label>
            <input
              type="number"
              name="sales_hours_per_week"
              min="0"
              step="0.5"
              value={salesHours}
              onChange={(e) => setSalesHours(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        {totalHours > 0 && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            Total: {totalHours}h/semana
          </p>
        )}
      </div>

      {/* Sueldo */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sueldo</p>

        {isEditing && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={updateWage}
              onChange={(e) => setUpdateWage(e.target.checked)}
              className="accent-amber-600"
            />
            <span className="text-sm text-gray-700">Registrar nuevo sueldo por hora</span>
          </label>
        )}

        {updateWage && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tarifa por hora (MXN) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="hourly_rate"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="ej. 45.00"
              className={inputClass}
            />
            {weeklyPreview != null && (
              <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                Sueldo semanal ≈ {formatMXN(weeklyPreview)} · Mensual ≈ {formatMXN(monthlyPreview ?? 0)}
              </div>
            )}
          </div>
        )}

        {isEditing && defaultValues?.current_hourly_rate != null && !updateWage && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-600">
            Tarifa vigente: {formatMXN(defaultValues.current_hourly_rate)}/hr
          </div>
        )}

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
            placeholder="ej. 2000"
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
          className="flex-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-60"
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
