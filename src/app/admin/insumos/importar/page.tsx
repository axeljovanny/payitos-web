import InsumoImportForm from '@/components/insumos/insumo-import-form'
import BackButton from '@/components/ui/back-button'

export default function ImportarInsumosPage() {
  return (
    <div className="space-y-5">
      <div>
        <BackButton href="/admin/insumos" label="Insumos" />
        <h1 className="text-xl font-bold text-gray-800 mt-2">Carga masiva de insumos</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Importa desde un archivo CSV o JSON. Revisa el preview antes de confirmar.
        </p>
      </div>

      <InsumoImportForm />
    </div>
  )
}
