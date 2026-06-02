import { fetchCategoryOptions } from '@/lib/ingredientes/queries'
import { deleteCategory } from '@/lib/ingredientes/actions'
import AddCategoryForm from '@/components/insumos/add-category-form'
import BackButton from '@/components/ui/back-button'

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

export default async function CategoriasInsumosPage() {
  const categories = await fetchCategoryOptions()

  return (
    <div className="space-y-5">
      <div>
        <BackButton href="/admin/insumos" label="Insumos" />
        <h1 className="text-xl font-bold text-gray-800 mt-2">Categorías de insumos</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Agrupa tus insumos para organizarlos más fácil.
        </p>
      </div>

      <AddCategoryForm />

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Sin categorías todavía. Agrega la primera arriba.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between px-4 py-3.5 gap-3">
                <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={cat.id} />
                  <button
                    type="submit"
                    title="Eliminar categoría"
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 px-1">
        No puedes eliminar una categoría si hay insumos asignados a ella. Cambia primero la categoría de esos insumos.
      </p>
    </div>
  )
}
