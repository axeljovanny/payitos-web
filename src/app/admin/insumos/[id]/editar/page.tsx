import { notFound } from 'next/navigation'
import {
  fetchIngredienteById,
  fetchPriceHistory,
  fetchCategoryOptions,
} from '@/lib/ingredientes/queries'
import { updateIngrediente, deletePriceEntry } from '@/lib/ingredientes/actions'
import { formatMXN, formatDate } from '@/lib/costing/format'
import IngredienteForm from '@/components/ingredientes/ingrediente-form'
import PriceEntryForm from '@/components/ingredientes/price-entry-form'
import BackButton from '@/components/ui/back-button'

interface Props {
  params: Promise<{ id: string }>
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

export default async function EditarInsumoAdminPage({ params }: Props) {
  const { id } = await params

  const [ingrediente, categories, priceHistory] = await Promise.all([
    fetchIngredienteById(id),
    fetchCategoryOptions(),
    fetchPriceHistory(id),
  ])

  if (!ingrediente) notFound()

  const latestPrice = priceHistory[0] ?? null

  return (
    <div className="space-y-6">
      <div>
        <BackButton href="/admin/insumos" label="Insumos" />
        <h1 className="text-xl font-bold text-gray-800 mt-2">Editar insumo</h1>
        <p className="text-sm text-gray-500 mt-0.5">{ingrediente.name}</p>
      </div>

      <IngredienteForm
        categories={categories}
        action={updateIngrediente}
        basePath="/admin/insumos"
        entityLabel="insumo"
        defaultValues={{
          id: ingrediente.id,
          name: ingrediente.name,
          base_unit: ingrediente.base_unit,
          category_id: ingrediente.category_id,
          supplier_name: ingrediente.supplier_name,
        }}
      />

      {/* ── Historial de precios con borrado ── */}
      {(
        <div className="space-y-3" id="historial">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-gray-700">Historial de precios</p>
            {latestPrice && (
              <span className="text-xs text-gray-500">
                Vigente:{' '}
                <span className="font-semibold text-gray-800">
                  {formatMXN(latestPrice.unit_price)} / {ingrediente.base_unit}
                </span>
              </span>
            )}
          </div>

          {priceHistory.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
              <p className="text-sm text-gray-500">Sin precios registrados.</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Agrega el precio actual para activar el motor de costos.
              </p>
            </div>
          )}

          {priceHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Presentación</th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-500">Compra</th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-500">/{ingrediente.base_unit}</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((entry, i) => (
                      <tr key={entry.id} className={`border-t border-gray-100 ${i === 0 ? 'bg-pink-50' : ''}`}>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="font-medium">{entry.presentation_name}</div>
                          <div className="text-xs text-gray-400">
                            {entry.presentation_quantity} {entry.presentation_unit}
                            {i === 0 && <span className="ml-2 text-[#ed507c] font-medium">· vigente</span>}
                          </div>
                          <div className="text-xs text-gray-400">{formatDate(entry.effective_from)}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                          {formatMXN(entry.purchase_price)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800 tabular-nums">
                          {formatMXN(entry.unit_price)}
                        </td>
                        <td className="px-3 py-3">
                          <form action={deletePriceEntry}>
                            <input type="hidden" name="entry_id" value={entry.id} />
                            <input type="hidden" name="ingredient_id" value={ingrediente.id} />
                            <input type="hidden" name="context_path" value="/admin/insumos" />
                            <button
                              type="submit"
                              title="Eliminar este precio"
                              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <TrashIcon />
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {priceHistory.length === 1 && (
                <p className="px-4 py-2 text-xs text-[#d43a6a] bg-pink-50 border-t border-pink-100">
                  Solo hay un precio registrado. Eliminar lo dejará sin costo vigente.
                </p>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Agregar precio
            </p>
            <PriceEntryForm
              ingredientId={ingrediente.id}
              baseUnit={ingrediente.base_unit}
              basePath="/admin/insumos"
            />
          </div>
        </div>
      )}
    </div>
  )
}
