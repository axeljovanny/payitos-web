import Link from 'next/link'
import InsumoImportForm from '@/components/insumos/insumo-import-form'

export default function ImportarInsumosPage() {
  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/insumos"
          className="text-xs text-amber-700 hover:text-amber-900 font-medium"
        >
          ← Insumos
        </Link>
        <h1 className="text-xl font-bold text-gray-800 mt-2">Carga masiva de insumos</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Importa desde un archivo CSV o JSON. Revisa el preview antes de confirmar.
        </p>
      </div>

      <InsumoImportForm />
    </div>
  )
}
