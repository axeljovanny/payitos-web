import Link from 'next/link'
import { fetchProductos } from '@/lib/productos/queries'
import ProductosPageClient from '@/components/productos/productos-page-client'

export default async function AdminProductosPage() {
  const productos = await fetchProductos()
  const activos = productos.filter((p) => p.active)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Productos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activos.length} activo{activos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
        >
          Nuevo
        </Link>
      </div>

      <ProductosPageClient productos={productos} />
    </div>
  )
}
