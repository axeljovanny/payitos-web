import { fetchCategoryOptions } from '@/lib/ingredientes/queries'
import { createIngrediente } from '@/lib/ingredientes/actions'
import IngredienteForm from '@/components/ingredientes/ingrediente-form'

export default async function NuevoInsumoPanaderoPage() {
  const categories = await fetchCategoryOptions()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Nuevo insumo</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Registra el insumo y su unidad de medida base.
        </p>
      </div>
      <IngredienteForm
        categories={categories}
        action={createIngrediente}
        basePath="/panadero/insumos"
        entityLabel="insumo"
      />
    </div>
  )
}
