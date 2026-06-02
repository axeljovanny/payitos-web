import Link from 'next/link'
import { fetchIngredientes } from '@/lib/ingredientes/queries'
import InsumosPageClient from '@/components/insumos/insumos-page-client'

export default async function AdminInsumosPage() {
  const insumos = await fetchIngredientes()
  const activos = insumos.filter((i) => i.active)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Insumos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activos.length} activo{activos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/insumos/categorias"
            className="rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 text-sm font-medium px-3 py-2.5 transition-colors"
          >
            Categorías
          </Link>
          <Link
            href="/admin/insumos/nuevo"
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
          >
            Nuevo
          </Link>
        </div>
      </div>

      <InsumosPageClient insumos={insumos} basePath="/admin/insumos" showImport />
    </div>
  )
}
