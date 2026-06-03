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
      className={`rounded-xl px-4 py-3 ${receta.active ? '' : 'opacity-60'}`}
      style={{
        background: 'var(--surface)',
        border: receta.active
          ? '1px solid var(--border)'
          : '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium truncate" style={{ color: 'var(--foreground)' }}>
            {receta.products?.name ?? 'Producto desconocido'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-faint)' }}>
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
                className="text-xs font-medium transition-colors"
                style={{ color: 'var(--brand-dark)' }}
              >
                Editar
              </Link>
              <form action={deactivateReceta}>
                <input type="hidden" name="id" value={receta.id} />
                <button
                  type="submit"
                  className="text-xs transition-colors"
                  style={{ color: 'var(--ink-faint)' }}
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
                className="text-xs font-medium transition-colors"
                style={{ color: 'var(--brand-dark)' }}
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
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Recetas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            {activas.length} activa{activas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/panadero/recetas/nueva"
          className="rounded-xl text-sm font-bold px-4 py-2.5 transition-[transform,box-shadow] active:scale-[0.97]"
          style={{
            background: 'linear-gradient(180deg, #f06090 0%, #ed507c 100%)',
            color: '#ffffe9',
            boxShadow: '0 3px 10px rgba(237,80,124,0.30)',
          }}
        >
          Nueva receta
        </Link>
      </div>

      {recetas.length === 0 && (
        <div
          className="rounded-xl p-10 text-center"
          style={{ border: '1px dashed var(--border)', background: 'var(--surface)' }}
        >
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>No hay recetas registradas todavía.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>Crea la primera para comenzar.</p>
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
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
            Inactivas
          </p>
          {inactivas.map((r) => (
            <RecetaCard key={r.id} receta={r} />
          ))}
        </div>
      )}
    </div>
  )
}
