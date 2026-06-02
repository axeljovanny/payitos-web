import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchProductoById, fetchActiveRecipeForProduct } from '@/lib/productos/queries'
import { deactivateProducto, reactivateProducto } from '@/lib/productos/actions'
import { formatMXN, formatPercent } from '@/lib/costing/format'

interface Props {
  params: Promise<{ id: string }>
}

const COOKING_LABELS: Record<string, string> = {
  horno: 'Horno',
  estufa: 'Estufa',
  frio: 'Frío',
  otro: 'Otro',
}

export default async function ProductoDetailPage({ params }: Props) {
  const { id } = await params

  const [product, recipe] = await Promise.all([
    fetchProductoById(id),
    fetchActiveRecipeForProduct(id),
  ])

  if (!product) notFound()

  return (
    <div className="space-y-5">
      <Link href="/admin/productos" className="text-sm text-amber-700 hover:underline">
        ← Productos
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{product.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {product.category || 'Sin categoría'} · {COOKING_LABELS[product.cooking_type] ?? product.cooking_type}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            product.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {product.active ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Datos del producto */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Datos del producto
        </p>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-gray-500">Precio de venta</span>
          <span className="font-medium text-gray-800 text-right">{formatMXN(product.sale_price)}</span>
          <span className="text-gray-500">Margen objetivo</span>
          <span className="font-medium text-gray-800 text-right">{formatPercent(product.target_margin_percent)}</span>
          <span className="text-gray-500">Rendimiento est.</span>
          <span className="font-medium text-gray-800 text-right">{product.default_batch_yield} pzas</span>
          <span className="text-gray-500">Tiempo est.</span>
          <span className="font-medium text-gray-800 text-right">{product.production_time_hours}h</span>
        </div>
      </div>

      {/* Receta */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Receta</p>
          <Link
            href={`/admin/productos/${id}/receta`}
            className="text-xs font-medium text-amber-700 hover:text-amber-900"
          >
            {recipe ? 'Editar receta' : 'Crear receta'}
          </Link>
        </div>
        {recipe ? (
          <div className="grid grid-cols-2 gap-y-1.5 text-sm">
            <span className="text-gray-500">Rendimiento</span>
            <span className="font-medium text-gray-800 text-right">{recipe.batch_yield} pzas</span>
            <span className="text-gray-500">Cocción</span>
            <span className="font-medium text-gray-800 text-right">
              {COOKING_LABELS[recipe.cooking_type] ?? recipe.cooking_type}
            </span>
            <span className="text-gray-500">Insumos</span>
            <span className="font-medium text-gray-800 text-right">{recipe.ingredient_count}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Sin receta activa. Crea una para calcular el costo real.
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/admin/productos/${id}/editar`}
          className="rounded-lg border border-gray-300 text-gray-700 font-medium py-2.5 text-sm text-center hover:bg-gray-50 transition-colors"
        >
          Editar producto
        </Link>
        <Link
          href={`/admin/costos/${id}`}
          className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 text-sm text-center transition-colors"
        >
          Ver costos →
        </Link>
      </div>

      <div className="flex justify-center">
        {product.active ? (
          <form action={deactivateProducto}>
            <input type="hidden" name="id" value={product.id} />
            <button type="submit" className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Desactivar producto
            </button>
          </form>
        ) : (
          <form action={reactivateProducto}>
            <input type="hidden" name="id" value={product.id} />
            <button type="submit" className="text-xs font-medium text-amber-700 hover:text-amber-900">
              Reactivar producto
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
