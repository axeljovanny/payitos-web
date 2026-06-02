'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { IngredienteListItem } from '@/lib/ingredientes/queries'
import { deactivateIngrediente, reactivateIngrediente } from '@/lib/ingredientes/actions'
import { formatMXN, formatDate } from '@/lib/costing/format'

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 shrink-0">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 shrink-0">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

interface Props {
  ing: IngredienteListItem
  basePath: string
}

export default function InsumoCard({ ing, basePath }: Props) {
  const [expanded, setExpanded] = useState(false)
  const isPrep = !!ing.prep_recipe_id

  return (
    <div className={`bg-white rounded-2xl border transition-shadow ${
      ing.active
        ? expanded ? 'border-amber-200 shadow-md' : 'border-gray-200 shadow-sm'
        : 'border-gray-100 opacity-60'
    }`}>
      {/* ── Cabecera siempre visible ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-4 flex items-center gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-gray-800 truncate">{ing.name}</span>
            {isPrep && (
              <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                prep
              </span>
            )}
            {!ing.active && (
              <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                inactivo
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {ing.unit_price != null && !isPrep ? (
            <span className="text-lg font-bold text-gray-800 tabular-nums">
              {formatMXN(ing.unit_price)}<span className="text-sm font-normal text-gray-400">/{ing.base_unit}</span>
            </span>
          ) : isPrep ? (
            <span className="text-sm text-amber-600 font-medium">auto</span>
          ) : (
            <span className="text-sm text-red-500">sin precio</span>
          )}
          <span className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </span>
        </div>
      </button>

      {/* ── Detalle expandido ── */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
          {/* Grid de detalles */}
          {!isPrep && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4">
              {ing.supplier_name && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Proveedor</p>
                  <p className="text-sm font-medium text-gray-700">{ing.supplier_name}</p>
                </div>
              )}
              {ing.presentation_name && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Presentación</p>
                  <p className="text-sm font-medium text-gray-700">
                    {ing.presentation_name}
                    {ing.presentation_quantity != null && (
                      <span className="font-normal text-gray-400"> · {ing.presentation_quantity} {ing.presentation_unit}</span>
                    )}
                  </p>
                </div>
              )}
              {ing.purchase_price != null && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Costo presentación</p>
                  <p className="text-sm font-medium text-gray-700">{formatMXN(ing.purchase_price)}</p>
                </div>
              )}
              {ing.effective_from && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Precio desde</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(ing.effective_from)}</p>
                </div>
              )}
              {!ing.supplier_name && !ing.presentation_name && !ing.purchase_price && (
                <p className="col-span-2 text-sm text-gray-400 italic pt-3">Sin datos de proveedor ni precio.</p>
              )}
            </div>
          )}

          {isPrep && (
            <p className="pt-3 text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
              Preparación — el costo se calcula automáticamente desde la receta vinculada.
            </p>
          )}

          {/* Acciones */}
          <div className="flex flex-col gap-2 pt-1">
            {ing.active ? (
              <>
                <Link
                  href={`${basePath}/${ing.id}/editar`}
                  className="w-full text-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 text-sm transition-colors"
                >
                  Editar insumo
                </Link>
                {!isPrep && (
                  <Link
                    href={`${basePath}/${ing.id}/editar#historial`}
                    className="w-full text-center rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold py-3 text-sm transition-colors"
                  >
                    Ver / editar historial de precios
                  </Link>
                )}
                <form action={deactivateIngrediente}>
                  <input type="hidden" name="id" value={ing.id} />
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-medium py-3 text-sm transition-colors"
                  >
                    Desactivar insumo
                  </button>
                </form>
              </>
            ) : (
              <form action={reactivateIngrediente}>
                <input type="hidden" name="id" value={ing.id} />
                <button
                  type="submit"
                  className="w-full rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50 font-medium py-3 text-sm transition-colors"
                >
                  Reactivar insumo
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
