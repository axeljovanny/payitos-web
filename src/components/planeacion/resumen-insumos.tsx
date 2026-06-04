import type { WeeklyPlanIngredientResult } from '@/lib/planeacion/types'

interface Props {
  result: WeeklyPlanIngredientResult
}

function StatusDot({ shortage, required }: { shortage: number; required: number }) {
  if (shortage > 0) {
    return (
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ background: '#ef4444' }}
        title="Faltante"
      />
    )
  }
  if (required > 0) {
    return (
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ background: '#22c55e' }}
        title="Cubierto"
      />
    )
  }
  return null
}

export default function ResumenInsumos({ result }: Props) {
  const { requirements, products_without_recipe, products_without_ingredients, shopping_list } =
    result

  const hasWarnings =
    products_without_recipe.length > 0 || products_without_ingredients.length > 0

  if (requirements.length === 0 && !hasWarnings) {
    return (
      <div
        className="rounded-2xl p-5 text-center"
        style={{ border: '1px dashed var(--border)', background: 'var(--surface)' }}
      >
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Sin items planeados — guarda la planeación primero.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Warnings */}
      {hasWarnings && (
        <div
          className="rounded-2xl p-4 space-y-2"
          style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
        >
          <p className="text-sm font-bold" style={{ color: '#92400e' }}>
            ⚠ Advertencias
          </p>
          {products_without_recipe.length > 0 && (
            <div>
              <p className="text-xs font-semibold" style={{ color: '#92400e' }}>
                Sin receta (excluidos del cálculo):
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#78350f' }}>
                {products_without_recipe.join(', ')}
              </p>
            </div>
          )}
          {products_without_ingredients.length > 0 && (
            <div>
              <p className="text-xs font-semibold" style={{ color: '#92400e' }}>
                Receta sin ingredientes:
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#78350f' }}>
                {products_without_ingredients.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ingredient requirements */}
      {requirements.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
              Insumos requeridos
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-faint)' }}>
              {requirements.length} ingrediente{requirements.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {requirements.map((req) => (
              <div key={req.ingredient_id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusDot shortage={req.shortage} required={req.required_quantity} />
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {req.ingredient_name}
                    </span>
                  </div>
                  <span
                    className="text-sm font-bold shrink-0"
                    style={{ color: req.shortage > 0 ? '#ef4444' : 'var(--foreground)' }}
                  >
                    {req.required_quantity} {req.unit}
                  </span>
                </div>

                <div
                  className="mt-1 flex items-center gap-3 text-xs"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  <span>Stock: {req.current_stock} {req.unit}</span>
                  {req.shortage > 0 ? (
                    <span style={{ color: '#ef4444' }}>
                      Faltante: {req.shortage} {req.unit}
                    </span>
                  ) : (
                    <span style={{ color: '#16a34a' }}>Cubierto</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shopping list */}
      {shopping_list.length > 0 ? (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #fca5a5', background: '#fff5f5' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #fca5a5' }}>
            <p className="font-bold text-sm" style={{ color: '#991b1b' }}>
              🛒 Lista de compras
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>
              {shopping_list.length} artículo{shopping_list.length !== 1 ? 's' : ''} faltante
              {shopping_list.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="divide-y" style={{ borderColor: '#fecaca' }}>
            {shopping_list.map((req) => (
              <div
                key={req.ingredient_id}
                className="px-4 py-3 flex items-center justify-between gap-2"
              >
                <span className="text-sm font-medium" style={{ color: '#7f1d1d' }}>
                  {req.ingredient_name}
                </span>
                <span className="text-sm font-bold shrink-0" style={{ color: '#dc2626' }}>
                  {req.shortage} {req.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : requirements.length > 0 ? (
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-2"
          style={{ background: '#f0fdf4', border: '1px solid #86efac' }}
        >
          <span style={{ color: '#16a34a' }}>✓</span>
          <p className="text-sm font-semibold" style={{ color: '#15803d' }}>
            Todos los insumos están cubiertos con el stock actual.
          </p>
        </div>
      ) : null}
    </div>
  )
}
