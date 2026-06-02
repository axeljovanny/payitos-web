import Link from 'next/link'
import { fetchRecetas, type RecetaListItem } from '@/lib/recetas/queries'
import { deactivateReceta, reactivateReceta } from '@/lib/recetas/actions'

const COOKING_LABELS: Record<string, string> = {
  horno: 'Horno',
  estufa: 'Estufa',
  frio: 'Frío',
  otro: 'Otro',
}

function RecetaCard({ receta }: { receta: RecetaListItem }) {
  return (
    <div
      className={`bg-white rounded-xl border px-4 py-3 ${
        receta.active ? 'border-gray-200' : 'border-gray-100 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-800 truncate">
            {receta.products?.name ?? 'Producto desconocido'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {receta.batch_yield} pzas ·{' '}
            {COOKING_LABELS[receta.cooking_type] ?? receta.cooking_type} ·{' '}
            {receta.production_time_hours}h
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {receta.active ? (
            <>
              <Link
                href={`/panadero/recetas/${receta.id}/editar`}
                className="text-xs font-medium text-amber-700 hover:text-amber-900"
              >
                Editar
              </Link>
              <form action={deactivateReceta}>
                <input type="hidden" name="id" value={receta.id} />
                <button
                  type="submit"
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Desactivar
                </button>
              </form>
            </>
          ) : (
            <form action={reactivateReceta}>
              <input type="hidden" name="id" value={receta.id} />
              <button
                type="submit"
                className="text-xs font-medium text-amber-700 hover:text-amber-900"
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

export default async function RecetasPage() {
  const recetas = await fetchRecetas()
  const activas = recetas.filter((r) => r.active)
  const inactivas = recetas.filter((r) => !r.active)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Recetas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activas.length} activa{activas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/panadero/recetas/nueva"
          className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-3 py-2 transition-colors"
        >
          Nueva receta
        </Link>
      </div>

      {recetas.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No hay recetas registradas todavía.</p>
          <p className="text-xs text-gray-400 mt-1">Crea la primera para comenzar.</p>
        </div>
      )}

      {activas.length > 0 && (
        <div className="space-y-2">
          {activas.map((r) => (
            <RecetaCard key={r.id} receta={r} />
          ))}
        </div>
      )}

      {inactivas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Inactivas</p>
          {inactivas.map((r) => (
            <RecetaCard key={r.id} receta={r} />
          ))}
        </div>
      )}
    </div>
  )
}
