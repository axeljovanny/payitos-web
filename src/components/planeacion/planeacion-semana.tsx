'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import type { ActionState } from '@/lib/planeacion/actions'
import type { ProductForPlan, SpecialOrdersByDay } from '@/lib/planeacion/types'

const BLOCKED_DAYS = new Set([4, 7])
const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface DayRow {
  _key: string
  product_id: string
  quantity: number
}

interface InitialItem {
  product_id: string
  day_of_week: number
  quantity_planned: number
}

interface Props {
  planId: string
  weekStart: string
  products: ProductForPlan[]
  initialItems: InitialItem[]
  specialOrdersByDay: SpecialOrdersByDay
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  readOnly?: boolean
  basePath?: string
}

function newRow(): DayRow {
  return { _key: Math.random().toString(36).slice(2), product_id: '', quantity: 0 }
}

function dayDateLabel(weekStart: string, dayIndex: number): string {
  const d = new Date(weekStart + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + dayIndex)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform duration-200"
      style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

interface DayCardProps {
  dow: number
  weekStart: string
  rows: DayRow[]
  products: ProductForPlan[]
  specials: SpecialOrdersByDay[number]
  readOnly: boolean
  onAddRow: () => void
  onRemoveRow: (key: string) => void
  onChangeProduct: (key: string, productId: string) => void
  onChangeQty: (key: string, qty: number) => void
}

function DayCard({
  dow,
  weekStart,
  rows,
  products,
  specials,
  readOnly,
  onAddRow,
  onRemoveRow,
  onChangeProduct,
  onChangeQty,
}: DayCardProps) {
  const [expanded, setExpanded] = useState(!BLOCKED_DAYS.has(dow))
  const blocked = BLOCKED_DAYS.has(dow)
  const dateLabel = dayDateLabel(weekStart, dow - 1)
  const totalManual = rows.reduce((s, r) => s + (r.quantity || 0), 0)
  const totalSpecials = specials.reduce((s, sp) => s + sp.quantity, 0)
  const totalPieces = totalManual + totalSpecials
  const hasSpecials = specials.length > 0
  const hasWarning = rows.some(
    (r) => r.product_id && !products.find((p) => p.id === r.product_id)?.has_recipe
  )

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: blocked ? '1px solid var(--border-subtle)' : '1px solid var(--border)',
        opacity: blocked && !hasSpecials ? 0.6 : 1,
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
                {DAY_NAMES[dow]}
              </span>
              {blocked && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--border)', color: 'var(--ink-muted)' }}
                >
                  Sin producción
                </span>
              )}
              {hasWarning && !blocked && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: '#fef3c7', color: '#92400e' }}
                >
                  ⚠ Sin receta
                </span>
              )}
            </div>
            <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
              {dateLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {totalPieces > 0 && (
            <span
              className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)' }}
            >
              {totalPieces} pzas
            </span>
          )}
          {hasSpecials && totalPieces === 0 && (
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: '#eff6ff', color: '#1d4ed8' }}
            >
              Pedidos
            </span>
          )}
          <span style={{ color: 'var(--ink-faint)' }}>
            <ChevronIcon expanded={expanded} />
          </span>
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div
          className="px-4 pb-4 space-y-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {/* Special orders */}
          {hasSpecials && (
            <div className="pt-3 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#1d4ed8' }}>
                Pedidos especiales
              </p>
              {specials.map((sp, i) => (
                <div
                  key={`${sp.order_id}-${i}`}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm"
                  style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
                >
                  <span className="truncate" style={{ color: '#1e3a8a' }}>
                    {sp.product_name}
                    <span className="ml-1.5 text-xs" style={{ color: '#3b82f6' }}>
                      ({sp.customer_name})
                    </span>
                  </span>
                  <span className="font-bold ml-2 shrink-0" style={{ color: '#1d4ed8' }}>
                    {sp.quantity} pzas
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Manual production rows */}
          {!blocked && (
            <div className="pt-3 space-y-2.5">
              {!hasSpecials && rows.length === 0 && (
                <p className="text-sm text-center py-2" style={{ color: 'var(--ink-faint)' }}>
                  Sin producción planeada
                </p>
              )}

              {rows.map((row) => {
                const selectedProduct = products.find((p) => p.id === row.product_id)
                const noRecipeWarning = row.product_id && !selectedProduct?.has_recipe
                return (
                  <div key={row._key} className="space-y-1">
                    <div className="flex gap-2 items-center">
                      {/* Product select */}
                      <select
                        value={row.product_id}
                        onChange={(e) => onChangeProduct(row._key, e.target.value)}
                        disabled={readOnly}
                        className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-sm transition-[box-shadow] focus:outline-none"
                        style={{
                          background: 'var(--background)',
                          border: '1.5px solid var(--border)',
                          color: row.product_id ? 'var(--foreground)' : 'var(--ink-faint)',
                        }}
                      >
                        <option value="">Selecciona pan…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {!p.has_recipe ? ' ⚠' : ''}
                          </option>
                        ))}
                      </select>

                      {/* Quantity */}
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={row.quantity || ''}
                        onChange={(e) => onChangeQty(row._key, Number(e.target.value))}
                        disabled={readOnly}
                        placeholder="Pzas"
                        className="w-20 rounded-xl px-3 py-2.5 text-sm text-center transition-[box-shadow] focus:outline-none"
                        style={{
                          background: 'var(--background)',
                          border: '1.5px solid var(--border)',
                          color: 'var(--foreground)',
                        }}
                      />

                      {/* Remove */}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => onRemoveRow(row._key)}
                          className="shrink-0 p-2 rounded-xl transition-colors"
                          style={{ color: 'var(--ink-faint)' }}
                          aria-label="Eliminar"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>

                    {/* No-recipe warning per row */}
                    {noRecipeWarning && (
                      <p className="text-xs px-1" style={{ color: '#92400e' }}>
                        Este producto no tiene receta — no se calculará en insumos.
                      </p>
                    )}
                  </div>
                )
              })}

              {/* Add row button */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={onAddRow}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    border: '1.5px dashed var(--border)',
                    color: 'var(--brand-dark)',
                    background: 'var(--brand-light)',
                  }}
                >
                  <PlusIcon />
                  Agregar pan
                </button>
              )}
            </div>
          )}

          {/* Blocked + has specials: only specials shown, no add button */}
          {blocked && !hasSpecials && (
            <p className="pt-3 text-sm text-center py-2" style={{ color: 'var(--ink-faint)' }}>
              Día bloqueado para producción manual.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function PlaneacionSemana({
  planId,
  weekStart,
  products,
  initialItems,
  specialOrdersByDay,
  action,
  readOnly = false,
  basePath = '/panadero/planeacion',
}: Props) {
  const [state, dispatch, pending] = useActionState(action, { error: null })

  const [dayItems, setDayItems] = useState<Record<number, DayRow[]>>(() => {
    const initial: Record<number, DayRow[]> = {}
    for (const item of initialItems) {
      if (!initial[item.day_of_week]) initial[item.day_of_week] = []
      initial[item.day_of_week].push({
        _key: Math.random().toString(36).slice(2),
        product_id: item.product_id,
        quantity: item.quantity_planned,
      })
    }
    return initial
  })

  function addRow(dow: number) {
    setDayItems((prev) => ({
      ...prev,
      [dow]: [...(prev[dow] ?? []), newRow()],
    }))
  }

  function removeRow(dow: number, key: string) {
    setDayItems((prev) => ({
      ...prev,
      [dow]: (prev[dow] ?? []).filter((r) => r._key !== key),
    }))
  }

  function changeProduct(dow: number, key: string, productId: string) {
    setDayItems((prev) => {
      const rows = prev[dow] ?? []
      // Prevent duplicate product in the same day
      const alreadyExists = rows.some((r) => r._key !== key && r.product_id === productId)
      if (alreadyExists && productId !== '') return prev
      return {
        ...prev,
        [dow]: rows.map((r) => (r._key === key ? { ...r, product_id: productId } : r)),
      }
    })
  }

  function changeQty(dow: number, key: string, qty: number) {
    setDayItems((prev) => ({
      ...prev,
      [dow]: (prev[dow] ?? []).map((r) => (r._key === key ? { ...r, quantity: qty } : r)),
    }))
  }

  const itemsJson = JSON.stringify(
    Object.entries(dayItems).flatMap(([dow, rows]) =>
      rows
        .filter((r) => r.product_id && r.quantity > 0)
        .map((r) => ({
          product_id: r.product_id,
          day_of_week: Number(dow),
          quantity_planned: r.quantity,
        }))
    )
  )

  // Total pieces for the whole week
  const totalWeek =
    Object.values(dayItems)
      .flat()
      .reduce((s, r) => s + (r.quantity || 0), 0) +
    Object.values(specialOrdersByDay)
      .flat()
      .reduce((s, sp) => s + sp.quantity, 0)

  return (
    <form action={dispatch} className="space-y-3">
      <input type="hidden" name="plan_id" value={planId} />
      <input type="hidden" name="items_json" value={itemsJson} />
      <input type="hidden" name="return_path" value={basePath} />

      {/* Error — visible arriba del todo */}
      {state.error && (
        <p
          className="text-sm rounded-xl px-3.5 py-2.5"
          style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
        >
          {state.error}
        </p>
      )}

      {/* Banner plan aprobado */}
      {readOnly && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}
        >
          Esta planeación está <strong>aprobada</strong> — solo lectura. Para editarla usa el botón{' '}
          <strong>Reabrir como borrador</strong>.
        </div>
      )}

      {/* Day cards */}
      {Array.from({ length: 7 }, (_, i) => {
        const dow = i + 1
        const rows = dayItems[dow] ?? []
        const specials = specialOrdersByDay[dow] ?? []
        return (
          <DayCard
            key={dow}
            dow={dow}
            weekStart={weekStart}
            rows={rows}
            products={products}
            specials={specials}
            readOnly={readOnly}
            onAddRow={() => addRow(dow)}
            onRemoveRow={(key) => removeRow(dow, key)}
            onChangeProduct={(key, pid) => changeProduct(dow, key, pid)}
            onChangeQty={(key, qty) => changeQty(dow, key, qty)}
          />
        )
      })}

      {/* Weekly summary bar */}
      {totalWeek > 0 && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ background: 'var(--brand-light)', border: '1px solid var(--border)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--brand-dark)' }}>
            Total semana
          </span>
          <span className="text-lg font-bold" style={{ color: 'var(--brand-dark)' }}>
            {totalWeek} pzas
          </span>
        </div>
      )}

      {/* Actions */}
      {!readOnly && (
        <div className="flex gap-3 pt-1">
          <Link
            href={`${basePath}/${planId}`}
            className="flex-1 text-center rounded-xl text-sm font-semibold px-4 py-3 transition-colors"
            style={{ background: 'var(--border-subtle)', color: 'var(--ink-muted)' }}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-xl text-sm font-bold px-4 py-3 transition-[transform,box-shadow] active:scale-[0.97] disabled:opacity-60"
            style={{
              background: 'linear-gradient(180deg, #f06090 0%, #ed507c 100%)',
              color: '#ffffe9',
              boxShadow: '0 3px 10px rgba(237,80,124,0.30)',
            }}
          >
            {pending ? 'Guardando...' : 'Guardar planeación'}
          </button>
        </div>
      )}
    </form>
  )
}
