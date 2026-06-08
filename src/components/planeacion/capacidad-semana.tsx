'use client'

import type { WeekCapacitySummary, DayCapacitySummary } from '@/lib/planeacion/types'

const DAY_NAMES = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// ── Semaphore helper ──────────────────────────────────────────────────────────

function utilColor(pct: number | null): { bg: string; text: string; label: string } {
  if (pct === null) return { bg: '#f3f4f6', text: '#6b7280', label: '—' }
  if (pct <= 70) return { bg: '#dcfce7', text: '#166534', label: `${pct}%` }
  if (pct <= 100) return { bg: '#fef3c7', text: '#92400e', label: `${pct}%` }
  return { bg: '#fee2e2', text: '#991b1b', label: `${pct}%` }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SemaphoreBar({ pct }: { pct: number | null }) {
  if (pct === null) return null
  const clamped = Math.min(pct, 100)
  const color = pct <= 70 ? '#22c55e' : pct <= 100 ? '#f59e0b' : '#ef4444'
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: '#e5e7eb' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  )
}

function DayRow({ day }: { day: DayCapacitySummary }) {
  const hasData = day.required_labor_hours > 0 || day.required_calendar_hours > 0
  return (
    <div
      className="px-4 py-3 space-y-2"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      {/* Day header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
          {DAY_NAMES[day.dow]}
        </span>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--ink-muted)' }}>
          <span>{day.total_pieces} pzas</span>
          {hasData && (
            <>
              <span>
                <span className="font-semibold text-gray-700">{day.required_calendar_hours}h</span>{' '}
                cal
              </span>
              <span>
                <span className="font-semibold text-[#d43a6a]">{day.required_labor_hours}h-h</span>{' '}
                MO
              </span>
            </>
          )}
        </div>
      </div>

      {/* Per-product rows */}
      <div className="space-y-1">
        {day.batches.map((b) => (
          <div
            key={b.product_id}
            className="flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5"
            style={{
              background: b.has_time_data ? 'var(--brand-light)' : '#f9fafb',
              color: 'var(--ink-muted)',
            }}
          >
            <span className="font-medium truncate" style={{ color: 'var(--foreground)' }}>
              {b.product_name}
            </span>
            <div className="flex items-center gap-2.5 shrink-0 ml-2">
              <span>{b.pieces} pzas</span>
              <span style={{ color: 'var(--ink-faint)' }}>·</span>
              <span>{b.batches_required} lotes</span>
              {b.has_time_data && (
                <>
                  <span style={{ color: 'var(--ink-faint)' }}>·</span>
                  <span className="text-gray-600">{b.calendar_hours}h cal</span>
                  <span style={{ color: 'var(--ink-faint)' }}>·</span>
                  <span className="text-[#d43a6a] font-semibold">{b.labor_hours}h-h</span>
                </>
              )}
              {!b.has_time_data && (
                <span className="text-amber-600">sin tiempos</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  summary: WeekCapacitySummary
}

export default function CapacidadSemana({ summary }: Props) {
  const semColor = utilColor(summary.utilization_percent)
  const hasAnyData = summary.total_labor_hours > 0 || summary.total_calendar_hours > 0
  const activeDays = summary.days.filter((d) => d.total_pieces > 0)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
          Capacidad de producción
        </p>
        {summary.utilization_percent !== null && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: semColor.bg, color: semColor.text }}
          >
            {semColor.label} carga
          </span>
        )}
      </div>

      {/* Weekly totals bar */}
      {hasAnyData && (
        <div
          className="px-4 py-3 grid grid-cols-2 gap-3"
          style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--background)' }}
        >
          <div className="space-y-0.5">
            <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Tiempo calendario</p>
            <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              {summary.total_calendar_hours}h
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Horas-hombre</p>
            <p className="text-lg font-bold" style={{ color: '#d43a6a' }}>
              {summary.total_labor_hours}h-h
            </p>
          </div>

          {summary.available_labor_hours_per_week > 0 && (
            <div className="col-span-2 space-y-1">
              <div className="flex justify-between text-xs" style={{ color: 'var(--ink-muted)' }}>
                <span>Capacidad equipo</span>
                <span>
                  {summary.total_labor_hours}h-h / {summary.available_labor_hours_per_week}h-h disponibles
                </span>
              </div>
              <SemaphoreBar pct={summary.utilization_percent} />
            </div>
          )}

          {summary.available_labor_hours_per_week === 0 && (
            <p className="col-span-2 text-xs" style={{ color: 'var(--ink-faint)' }}>
              Configura integrantes del equipo para ver el semáforo de capacidad.
            </p>
          )}
        </div>
      )}

      {/* Per-day detail */}
      {activeDays.length > 0 ? (
        <div>
          {activeDays.map((day) => (
            <DayRow key={day.dow} day={day} />
          ))}
        </div>
      ) : (
        <p className="px-4 py-5 text-sm text-center" style={{ color: 'var(--ink-faint)' }}>
          Sin producción planeada esta semana.
        </p>
      )}

      {/* Warning: products without time data */}
      {summary.products_without_time_data.length > 0 && (
        <div
          className="px-4 py-3 text-xs rounded-b-2xl"
          style={{ background: '#fffbeb', borderTop: '1px solid #fde68a', color: '#92400e' }}
        >
          <span className="font-semibold">Sin pasos configurados:</span>{' '}
          {summary.products_without_time_data.join(', ')} — los tiempos aparecerán en 0.{' '}
          Configura los pasos de producción en la receta para obtener tiempos reales.
        </div>
      )}

      {/* If no time data at all */}
      {!hasAnyData && activeDays.length > 0 && (
        <div
          className="px-4 py-3 text-xs"
          style={{ background: '#fffbeb', borderTop: '1px solid #fde68a', color: '#92400e' }}
        >
          Ninguna receta tiene pasos de producción configurados. Edita las recetas y agrega los
          pasos para ver el desglose de tiempos reales.
        </div>
      )}
    </div>
  )
}
