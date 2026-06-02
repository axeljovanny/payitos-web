'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { ProductRow } from '@/lib/productos/queries'
import { deactivateProducto, reactivateProducto } from '@/lib/productos/actions'
import { formatMXN, formatPercent } from '@/lib/costing/format'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

function ProductoCard({ p }: { p: ProductRow }) {
  return (
    <div className={`bg-white rounded-xl border px-4 py-3 ${p.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/admin/productos/${p.id}`}
            className="font-medium text-gray-800 hover:text-amber-700 truncate block"
          >
            {p.name}
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">
            {p.category || 'Sin categoría'} · {formatMXN(p.sale_price)} · {formatPercent(p.target_margin_percent)} margen
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {p.active ? (
            <>
              <Link
                href={`/admin/productos/${p.id}/editar`}
                className="text-xs font-medium text-amber-700 hover:text-amber-900 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors"
              >
                Editar
              </Link>
              <form action={deactivateProducto}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  title="Desactivar"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <TrashIcon />
                </button>
              </form>
            </>
          ) : (
            <form action={reactivateProducto}>
              <input type="hidden" name="id" value={p.id} />
              <button
                type="submit"
                className="text-xs font-medium text-amber-700 hover:text-amber-900 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors"
              >
                Reactivar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

interface Props {
  productos: ProductRow[]
}

export default function ProductosPageClient({ productos }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return productos
    return productos.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q)
    )
  }, [query, productos])

  const activos = filtered.filter((p) => p.active)
  const inactivos = filtered.filter((p) => !p.active)
  const noResults = query.trim() && filtered.length === 0

  return (
    <div className="space-y-4">
      {/* ── Buscador ── */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto por nombre o categoría…"
          className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-10 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XIcon />
          </button>
        )}
      </div>

      {noResults && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Sin productos que coincidan con <strong>&ldquo;{query}&rdquo;</strong>.</p>
        </div>
      )}

      {activos.length > 0 && (
        <div className="space-y-2">
          {activos.map((p) => <ProductoCard key={p.id} p={p} />)}
        </div>
      )}

      {inactivos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Inactivos</p>
          {inactivos.map((p) => <ProductoCard key={p.id} p={p} />)}
        </div>
      )}

      {productos.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">Sin productos todavía.</p>
        </div>
      )}
    </div>
  )
}
