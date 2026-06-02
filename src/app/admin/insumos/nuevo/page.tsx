import { fetchCategoryOptions } from '@/lib/ingredientes/queries'
import { createIngrediente } from '@/lib/ingredientes/actions'
import IngredienteForm from '@/components/ingredientes/ingrediente-form'

export default async function NuevoInsumoAdminPage() {
  const categories = await fetchCategoryOptions()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Nuevo insumo</h1>
        <p className="text-sm text-gray-500 mt-0.5">Nombre, unidad base y precio inicial.</p>
      </div>
      <IngredienteForm
        categories={categories}
        action={createIngrediente}
        basePath="/admin/insumos"
        entityLabel="insumo"
      />
    </div>
  )
}
