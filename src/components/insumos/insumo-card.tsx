'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { IngredienteListItem } from '@/lib/ingredientes/queries'
import { deactivateIngrediente, reactivateIngrediente } from '@/lib/ingredientes/actions'
import { formatMXN, formatDate } from '@/lib/costing/format'

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 shrink-0">
      <polyline points="6 9 12 15 18 9" />
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
    <div
      className={`rounded-2xl transition-all duration-200 ${ing.active ? '' : 'opacity-55'}`}
      style={{
        background: 'var(--surface)',
        border: expanded
          ? '1px solid rgba(237,80,124,0.28)'
          : '1px solid var(--border-subtle)',
        boxShadow: expanded
          ? '0 4px 16px rgba(237,80,124,0.10), 0 1px 4px rgba(0,0,0,0.05)'
          : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Cabecera */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-4 flex items-center gap-3 text-left transition-colors duration-100 active:bg-pink-50/40 rounded-2xl"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold truncate" style={{ color: 'var(--foreground)' }}>
              {ing.name}
            </span>
            {isPrep && (
              <span
                className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)' }}
              >
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

        <div className="shrink-0 flex items-center gap-2.5">
          {ing.unit_price != null && !isPrep ? (
            <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
              {formatMXN(ing.unit_price)}
              <span className="text-sm font-normal" style={{ color: 'var(--ink-faint)' }}>
                /{ing.base_unit}
              </span>
            </span>
          ) : isPrep ? (
            <span className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>auto</span>
          ) : (
            <span className="text-sm text-red-500">sin precio</span>
          )}
          <span
            className="transition-transform duration-200"
            style={{
              color: 'var(--ink-faint)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <ChevronDownIcon />
          </span>
        </div>
      </button>

      {/* Detalle expandido */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {!isPrep && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4">
              {ing.supplier_name && (
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--ink-faint)' }}>Proveedor</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{ing.supplier_name}</p>
                </div>
              )}
              {ing.presentation_name && (
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--ink-faint)' }}>Presentación</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {ing.presentation_name}
                    {ing.presentation_quantity != null && (
                      <span className="font-normal" style={{ color: 'var(--ink-faint)' }}>
                        {' '}· {ing.presentation_quantity} {ing.presentation_unit}
                      </span>
                    )}
                  </p>
                </div>
              )}
              {ing.purchase_price != null && (
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--ink-faint)' }}>Costo presentación</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{formatMXN(ing.purchase_price)}</p>
                </div>
              )}
              {ing.effective_from && (
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--ink-faint)' }}>Precio desde</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{formatDate(ing.effective_from)}</p>
                </div>
              )}
              {!ing.supplier_name && !ing.presentation_name && !ing.purchase_price && (
                <p className="col-span-2 text-sm italic pt-3" style={{ color: 'var(--ink-faint)' }}>
                  Sin datos de proveedor ni precio.
                </p>
              )}
            </div>
          )}

          {isPrep && (
            <p
              className="mt-4 text-sm rounded-xl px-3 py-2.5"
              style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)' }}
            >
              Preparación — el costo se calcula automáticamente desde la receta vinculada.
            </p>
          )}

          {/* Acciones */}
          <div className="flex flex-col gap-2 pt-1">
            {ing.active ? (
              <>
                <Link
                  href={`${basePath}/${ing.id}/editar`}
                  className="w-full text-center rounded-xl py-3 text-sm font-bold tracking-wide transition-[transform,box-shadow] duration-100 active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(180deg, #f06090 0%, #ed507c 100%)',
                    color: '#ffffe9',
                    boxShadow: '0 3px 10px rgba(237,80,124,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  Editar insumo
                </Link>
                {!isPrep && (
                  <Link
                    href={`${basePath}/${ing.id}/editar#historial`}
                    className="w-full text-center rounded-xl border py-3 text-sm font-semibold transition-[transform,background-color] duration-100 active:scale-[0.97]"
                    style={{
                      borderColor: 'rgba(237,80,124,0.28)',
                      color: 'var(--brand-dark)',
                    }}
                  >
                    Ver / editar historial de precios
                  </Link>
                )}
                <form action={deactivateIngrediente}>
                  <input type="hidden" name="id" value={ing.id} />
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-medium py-3 text-sm transition-[transform,background-color] duration-100 active:scale-[0.97]"
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
                  className="w-full rounded-xl border py-3 text-sm font-semibold transition-[transform,background-color] duration-100 active:scale-[0.97]"
                  style={{ borderColor: 'rgba(237,80,124,0.28)', color: 'var(--brand-dark)' }}
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
