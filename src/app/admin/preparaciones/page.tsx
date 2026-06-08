import Link from 'next/link'
import { fetchPreparations, fetchPrepCostMap } from '@/lib/preparaciones/queries'
import { deletePreparation, reactivatePreparation } from '@/lib/preparaciones/actions'
import { formatUnitPrice } from '@/lib/costing/format'

export default async function PreparacionesPage() {
  const [preparaciones, costs] = await Promise.all([
    fetchPreparations(),
    fetchPrepCostMap(),
  ])

  const activas = preparaciones.filter((p) => p.active)
  const inactivas = preparaciones.filter((p) => !p.active)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Preparaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Subrecetas reutilizables.</p>
        </div>
        <Link href="/admin/preparaciones/nueva" className="rounded-lg bg-[#ed507c] hover:bg-[#d43a6a] text-white font-medium px-4 py-2 text-sm transition-colors">
          + Nueva
        </Link>
      </div>

      {activas.length > 0 && (
        <div className="space-y-2">
          {activas.map((p) => {
            const c = costs[p.id]
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/admin/preparaciones/${p.id}/editar`} className="font-medium text-gray-800 hover:text-[#d43a6a] truncate block">{p.name}</Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Rinde {p.yield_quantity} {p.yield_unit} · {p.item_count} insumos
                    {c ? ` · ${formatUnitPrice(c.unitCost)}/${p.yield_unit}` : ''}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Link href={`/admin/preparaciones/${p.id}/editar`} className="text-xs font-medium text-[#d43a6a] hover:text-[#8b1a42] px-2 py-1 rounded-lg hover:bg-pink-50 transition-colors">Editar</Link>
                  <form action={deletePreparation}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" title="Eliminar" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-sm">✕</button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {inactivas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Inactivas</p>
          {inactivas.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 opacity-60 px-4 py-3 flex items-center justify-between gap-3">
              <span className="font-medium text-gray-700 truncate">{p.name}</span>
              <form action={reactivatePreparation}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="text-xs font-medium text-[#d43a6a] hover:text-[#8b1a42] px-2 py-1 rounded-lg hover:bg-pink-50 transition-colors">Reactivar</button>
              </form>
            </div>
          ))}
        </div>
      )}

      {preparaciones.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">Sin preparaciones todavía.</p>
        </div>
      )}
    </div>
  )
}
