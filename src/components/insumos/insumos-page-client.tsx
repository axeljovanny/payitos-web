'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { IngredienteListItem } from '@/lib/ingredientes/queries'
import InsumoCard from './insumo-card'

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

interface Props {
  insumos: IngredienteListItem[]
  basePath: string
  showImport?: boolean
}

export default function InsumosPageClient({ insumos, basePath, showImport = false }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return insumos
    return insumos.filter((i) => i.name.toLowerCase().includes(q))
  }, [query, insumos])

  const activos = filtered.filter((i) => i.active)
  const inactivos = filtered.filter((i) => !i.active)

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
          placeholder="Buscar insumo por nombre…"
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

      {/* ── Sin resultados ── */}
      {noResults && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Sin insumos que coincidan con <strong>&ldquo;{query}&rdquo;</strong>.</p>
        </div>
      )}

      {/* ── Lista activos ── */}
      {activos.length > 0 && (
        <div className="space-y-2">
          {activos.map((ing) => (
            <InsumoCard key={ing.id} ing={ing} basePath={basePath} />
          ))}
        </div>
      )}

      {/* ── Lista inactivos ── */}
      {inactivos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Inactivos</p>
          {inactivos.map((ing) => (
            <InsumoCard key={ing.id} ing={ing} basePath={basePath} />
          ))}
        </div>
      )}

      {/* ── Lista vacía total ── */}
      {insumos.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No hay insumos registrados todavía.</p>
          <p className="text-xs text-gray-400 mt-1">Crea el primero o importa desde CSV/JSON.</p>
        </div>
      )}

      {/* ── Botón importar (solo Admin) ── */}
      {showImport && (
        <div className="pt-2 border-t border-gray-100">
          <Link
            href={`${basePath}/importar`}
            className="block w-full text-center rounded-xl border border-dashed border-gray-300 text-gray-500 hover:border-amber-300 hover:text-amber-700 font-medium py-3 text-sm transition-colors"
          >
            Carga masiva desde CSV / JSON
          </Link>
        </div>
      )}
    </div>
  )
}
